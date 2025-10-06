// backend/src/controllers/quizController.js
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');
const UserProgress = require('../models/UserProgress');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');

// Get all quizzes
const getQuizzes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      course,
      difficulty,
      search
    } = req.query;

    const filter = { isPublished: true };
    
    if (course) filter.course = course;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const quizzes = await Quiz.find(filter)
      .populate('course', 'title subject level')
      .populate('creator', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get user attempts for each quiz if user is authenticated
    if (req.user) {
      for (let quiz of quizzes) {
        const attemptCount = await QuizAttempt.countDocuments({
          quiz: quiz._id,
          user: req.user.id
        });
        quiz.attempts = {
          ...quiz.attempts,
          current: attemptCount
        };
      }
    }

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

// Get single quiz
const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .populate('course', 'title subject level')
      .populate('creator', 'name avatar bio')
      .lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Get user attempts if authenticated
    let userAttempts = [];
    let remainingAttempts = quiz.attempts.allowed;

    if (req.user) {
      userAttempts = await QuizAttempt.find({
        quiz: id,
        user: req.user.id
      }).sort({ createdAt: -1 });

      remainingAttempts = Math.max(0, quiz.attempts.allowed - userAttempts.length);
    }

    // Remove correct answers from questions if user hasn't completed quiz
    const sanitizedQuestions = quiz.questions.map(question => {
      const { correctAnswer, ...questionWithoutAnswer } = question;
      return {
        ...questionWithoutAnswer,
        options: question.options?.map(option => ({
          text: option.text,
          _id: option._id
          // Remove isCorrect from options
        }))
      };
    });

    res.json({
      success: true,
      data: {
        quiz: {
          ...quiz,
          questions: sanitizedQuestions
        },
        userAttempts,
        remainingAttempts
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

// Create quiz
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

    // Verify course exists
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const quizData = {
      ...req.body,
      creator: req.user.id,
      totalPoints: req.body.questions.reduce((total, q) => total + (q.points || 1), 0)
    };

    const quiz = await Quiz.create(quizData);
    await quiz.populate('course', 'title subject level');

    logger.info(`New quiz created: ${quiz.title} by ${req.user.email}`);

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

// Generate quiz with Gemini AI
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

    // Get course content for context
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    logger.info(`Generating quiz with Gemini for course: ${course.title} by ${req.user.email}`);

    // Generate quiz using Gemini
    const generatedQuiz = await geminiService.generateQuiz(
      {
        title: course.title,
        description: course.description,
        lessons: course.lessons
      },
      difficulty,
      numQuestions,
      questionTypes,
      topics
    );

    // Add course reference and creator
    const quizData = {
      ...generatedQuiz,
      course: courseId,
      creator: req.user.id,
      isPublished: true // Auto-publish AI generated quizzes
    };

    const quiz = await Quiz.create(quizData);

    // Populate course information
    await quiz.populate('course', 'title subject level');

    logger.info(`Gemini-generated quiz created: ${quiz.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully with Gemini AI',
      data: { quiz }
    });

  } catch (error) {
    logger.error('Generate quiz error:', error);
    
    let errorMessage = 'Failed to generate quiz';
    if (error.message.includes('API key')) {
      errorMessage = 'AI service configuration error';
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      errorMessage = 'AI service temporarily unavailable. Please try again later.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update quiz
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
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership or admin role
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this quiz'
      });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    // Recalculate total points if questions are updated
    if (req.body.questions) {
      updateData.totalPoints = req.body.questions.reduce((total, q) => total + (q.points || 1), 0);
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('course', 'title subject level')
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

// Delete quiz
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check ownership or admin role
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    await Quiz.findByIdAndDelete(id);

    // Clean up quiz attempts
    await QuizAttempt.deleteMany({ quiz: id });

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

// Submit quiz attempt
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
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user has remaining attempts
    const existingAttempts = await QuizAttempt.countDocuments({
      quiz: id,
      user: req.user.id
    });

    if (existingAttempts >= quiz.attempts.allowed) {
      return res.status(400).json({
        success: false,
        message: 'No more attempts allowed for this quiz'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = question.type === 'multiple-choice' 
        ? question.options.find(opt => opt.isCorrect)?.text === userAnswer
        : question.correctAnswer === userAnswer;

      if (isCorrect) {
        correctAnswers++;
        totalPoints += question.points || 1;
      }

      detailedAnswers.push({
        questionId: question._id,
        answer: userAnswer,
        isCorrect,
        timeSpent: Math.floor(timeSpent / quiz.questions.length) // Rough estimate
      });
    });

    const percentage = (totalPoints / quiz.totalPoints) * 100;
    const passed = percentage >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await QuizAttempt.create({
      quiz: id,
      user: req.user.id,
      answers: detailedAnswers,
      score: {
        points: totalPoints,
        percentage: Math.round(percentage),
        passed
      },
      timeSpent: timeSpent || 0,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      completedAt: new Date(),
      status: 'completed'
    });

    // Update user progress
    await UserProgress.findOneAndUpdate(
      { user: req.user.id },
      {
        $inc: {
          'overallStats.totalQuizzesTaken': 1
        },
        $set: {
          'overallStats.lastStudyDate': new Date()
        }
      },
      { upsert: true }
    );

    // Prepare correct answers for response (if settings allow)
    let correctAnswersData = [];
    if (quiz.settings.showCorrectAnswers) {
      correctAnswersData = quiz.questions.map(question => ({
        questionId: question._id,
        correctAnswer: question.type === 'multiple-choice' 
          ? question.options.find(opt => opt.isCorrect)?.text
          : question.correctAnswer,
        explanation: question.explanation
      }));
    }

    logger.info(`Quiz attempt completed: ${quiz.title} by ${req.user.email} - Score: ${percentage}%`);

    res.status(201).json({
      success: true,
      message: `Quiz ${passed ? 'passed' : 'failed'}! Score: ${Math.round(percentage)}%`,
      data: {
        attempt,
        result: {
          score: totalPoints,
          totalPossible: quiz.totalPoints,
          percentage: Math.round(percentage),
          passed
        },
        correctAnswers: correctAnswersData,
        passed,
        newAchievements: [] // TODO: Implement achievements system
      }
    });

  } catch (error) {
    logger.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting quiz attempt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quiz attempts
const getQuizAttempts = async (req, res) => {
  try {
    const { id } = req.params;

    const attempts = await QuizAttempt.find({
      quiz: id,
      user: req.user.id
    }).sort({ createdAt: -1 });

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

// Get quiz results
const getQuizResults = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    const attempts = await QuizAttempt.find({
      quiz: id,
      user: req.user.id
    }).sort({ createdAt: -1 });

    if (attempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attempts found for this quiz'
      });
    }

    const bestAttempt = attempts.reduce((best, current) => 
      current.score.percentage > best.score.percentage ? current : best
    );

    const latestAttempt = attempts[0];

    res.json({
      success: true,
      data: {
        quiz: {
          title: quiz.title,
          totalQuestions: quiz.questions.length,
          passingScore: quiz.passingScore
        },
        attempts,
        bestAttempt,
        latestAttempt,
        summary: {
          totalAttempts: attempts.length,
          averageScore: Math.round(attempts.reduce((sum, att) => sum + att.score.percentage, 0) / attempts.length),
          bestScore: bestAttempt.score.percentage,
          passed: bestAttempt.score.passed
        }
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
