const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');
const aiService = require('../services/aiService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Get all quizzes - Open access to published quizzes
const getQuizzes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      course,
      difficulty,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter - only show published quizzes
    const filter = { isPublished: true };
    
    if (course) filter.course = course;
    if (difficulty) filter['questions.difficulty'] = difficulty;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const quizzes = await Quiz.find(filter)
      .populate('course', 'title subject level')
      .populate('creator', 'name avatar')
      .select('-questions.options.isCorrect -questions.correctAnswer') // Hide answers
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Quiz.countDocuments(filter);

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quizzes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single quiz - Open access to published quizzes
const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .populate('course', 'title subject level')
      .populate('creator', 'name avatar bio');

    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not published'
      });
    }

    // Auto-track progress for the course if user is authenticated
    let attempts = [];
    if (req.user) {
      let userProgress = await UserProgress.findOne({ user: req.user.id });
      if (!userProgress) {
        userProgress = await UserProgress.create({ user: req.user.id });
      }

      // Auto-add course to progress when accessing quiz
      if (!userProgress.getCourseProgress(quiz.course._id)) {
        await userProgress.updateCourseProgress(quiz.course._id, {
          status: 'enrolled',
          enrolledAt: new Date()
        });
      }

      const courseProgress = userProgress.getCourseProgress(quiz.course._id);
      attempts = courseProgress ? courseProgress.quizAttempts.filter(
        attempt => attempt.quiz.toString() === id
      ) : [];
    }

    // Hide correct answers unless quiz is completed or user is creator/admin
    let quizData = quiz.toObject();
    const isCreatorOrAdmin = req.user && (req.user.role === 'admin' || quiz.creator.toString() === req.user.id);
    const hasCompletedAttempt = attempts.some(attempt => attempt.status === 'completed');

    if (!isCreatorOrAdmin && !hasCompletedAttempt) {
      quizData.questions = quizData.questions.map(question => {
        const { correctAnswer, ...questionWithoutAnswer } = question;
        if (question.options) {
          questionWithoutAnswer.options = question.options.map(option => ({
            text: option.text,
            _id: option._id
          }));
        }
        return questionWithoutAnswer;
      });
    }

    res.json({
      success: true,
      data: {
        quiz: quizData,
        userAttempts: attempts,
        remainingAttempts: Math.max(0, quiz.attempts.allowed - attempts.length)
      }
    });

  } catch (error) {
    logger.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new quiz - Open to all learners
const createQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { course: courseId, ...quizData } = req.body;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const quiz = await Quiz.create({
      ...quizData,
      course: courseId,
      creator: req.user.id, // Changed from instructor to creator
      aiGenerated: false
    });

    await quiz.populate('course', 'title subject');

    logger.info(`Quiz created: ${quiz.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz }
    });

  } catch (error) {
    logger.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate quiz with AI - Open to all learners
const generateQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId, difficulty, numQuestions, questionTypes, topics } = req.body;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get course content for AI generation
    const courseContent = course.lessons.map(lesson => 
      `Lesson: ${lesson.title}\nContent: ${lesson.content}`
    ).join('\n\n');

    // Generate quiz using AI
    const generatedQuiz = await aiService.generateQuiz({
      courseContent,
      difficulty,
      numQuestions,
      questionTypes: questionTypes || ['multiple-choice'],
      topics
    });

    // Create quiz with AI-generated content
    const quiz = await Quiz.create({
      title: `${course.title} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
      description: `AI-generated ${difficulty} level quiz for ${course.title}`,
      course: courseId,
      questions: generatedQuiz.questions,
      timeLimit: Math.max(numQuestions * 2, 10), // 2 minutes per question, min 10 minutes
      difficulty,
      aiGenerated: true,
      generationPrompt: `Course: ${course.title}, Difficulty: ${difficulty}, Questions: ${numQuestions}`,
      creator: req.user.id, // Changed from instructor to creator
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswers: true,
        showScore: true,
        allowReview: true
      }
    });

    await quiz.populate('course', 'title subject');

    logger.info(`AI quiz generated: ${quiz.title} for course: ${course.title}`);

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully',
      data: { quiz }
    });

  } catch (error) {
    logger.error('Generate quiz error:', error);
    
    if (error.message.includes('OpenAI API')) {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while generating quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update quiz - Only creator or admin
const updateQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    
    // Resource ownership already checked by middleware
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('course', 'title subject')
     .populate('creator', 'name avatar');

    logger.info(`Quiz updated: ${updatedQuiz.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: { quiz: updatedQuiz }
    });

  } catch (error) {
    logger.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete quiz - Only creator or admin
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = req.resource; // From checkResourceOwnership middleware

    await Quiz.findByIdAndDelete(id);

    logger.info(`Quiz deleted: ${quiz.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    logger.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit quiz attempt - Open to all authenticated users
const submitQuizAttempt = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { answers, timeSpent, startedAt } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz || !quiz.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not published'
      });
    }

    // Get or create user progress
    let userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      userProgress = await UserProgress.create({ user: req.user.id });
    }

    // Auto-add course to progress if not exists
    if (!userProgress.getCourseProgress(quiz.course)) {
      await userProgress.updateCourseProgress(quiz.course, {
        status: 'enrolled',
        enrolledAt: new Date()
      });
    }

    const courseProgress = userProgress.getCourseProgress(quiz.course);

    // Check attempt limits
    const existingAttempts = courseProgress.quizAttempts.filter(
      attempt => attempt.quiz.toString() === id
    );

    if (existingAttempts.length >= quiz.attempts.allowed) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded for this quiz'
      });
    }

    // Calculate score
    const result = quiz.calculateScore(answers);

    // Create attempt record
    const attempt = {
      quiz: id,
      answers: answers.map((answer, index) => ({
        questionId: quiz.questions[index]._id,
        answer,
        isCorrect: quiz.questions[index].type === 'multiple-choice' ? 
          quiz.questions[index].options.find(opt => opt.isCorrect)?.text === answer :
          quiz.questions[index].correctAnswer === answer,
        timeSpent: 0 // Could be enhanced with per-question timing
      })),
      score: {
        points: result.score,
        percentage: result.percentage,
        passed: result.percentage >= quiz.passingScore
      },
      timeSpent: timeSpent || 0,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: new Date(),
      status: 'completed'
    };

    // Add attempt to user progress
    await userProgress.addQuizAttempt(quiz.course, attempt);

    // Check for achievements
    const newAchievements = userProgress.checkAchievements();

    logger.info(`Quiz attempt submitted: ${quiz.title} by ${req.user.email} - Score: ${result.percentage}%`);

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attempt,
        result,
        passed: result.percentage >= quiz.passingScore,
        newAchievements,
        correctAnswers: quiz.settings.showCorrectAnswers ? 
          quiz.questions.map(q => ({
            questionId: q._id,
            correctAnswer: q.correctAnswer || q.options?.find(opt => opt.isCorrect)?.text,
            explanation: q.explanation
          })) : undefined
      }
    });

  } catch (error) {
    logger.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quiz attempts
const getQuizAttempts = async (req, res) => {
  try {
    const { id } = req.params;

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.json({
        success: true,
        data: { attempts: [] }
      });
    }

    // Find attempts for this quiz across all courses
    const attempts = [];
    userProgress.courses.forEach(courseProgress => {
      const quizAttempts = courseProgress.quizAttempts.filter(
        attempt => attempt.quiz.toString() === id
      );
      attempts.push(...quizAttempts);
    });

    res.json({
      success: true,
      data: { attempts }
    });

  } catch (error) {
    logger.error('Get quiz attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz attempts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quiz results (detailed)
const getQuizResults = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id).populate('course', 'title');
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'No progress found'
      });
    }

    const courseProgress = userProgress.getCourseProgress(quiz.course._id);
    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: 'Course progress not found'
      });
    }

    const attempts = courseProgress.quizAttempts.filter(
      attempt => attempt.quiz.toString() === id
    );

    if (attempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attempts found for this quiz'
      });
    }

    // Calculate statistics
    const scores = attempts.map(attempt => attempt.score.percentage);
    const stats = {
      totalAttempts: attempts.length,
      bestScore: Math.max(...scores),
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      passed: attempts.some(attempt => attempt.score.passed),
      lastAttempt: attempts[attempts.length - 1]
    };

    res.json({
      success: true,
      data: {
        quiz: {
          title: quiz.title,
          passingScore: quiz.passingScore,
          totalPoints: quiz.totalPoints
        },
        attempts,
        stats
      }
    });

  } catch (error) {
    logger.error('Get quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getQuizzes,
  getQuiz,
  createQuiz,
  generateQuiz,  
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getQuizAttempts,
  getQuizResults
};
