const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');
const aiService = require('../services/aiService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Get all courses with filtering and pagination
const getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      subject,
      level,
      creator,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isPublished: true };
    
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (level) filter.level = level;
    if (creator) filter.creator = creator;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const courses = await Course.find(filter)
      .populate('creator', 'name avatar')
      .select('-lessons.content') // Exclude lesson content for performance
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single course by ID - Now open to everyone
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('creator', 'name avatar bio')
      .populate('lessons');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Auto-track progress if user is authenticated
    let userProgress = null;
    if (req.user) {
      let progress = await UserProgress.findOne({ user: req.user.id });
      if (!progress) {
        progress = await UserProgress.create({ user: req.user.id });
      }

      // Auto-add course to progress when accessed
      if (!progress.getCourseProgress(id)) {
        await progress.updateCourseProgress(id, {
          status: 'enrolled',
          enrolledAt: new Date()
        });
      }
      
      userProgress = progress.getCourseProgress(id);
    }

    res.json({
      success: true,
      data: {
        course,
        userProgress
      }
    });

  } catch (error) {
    logger.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new course - Open to all learners
// In src/controllers/courseController.js - createCourse function
const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const courseData = {
      ...req.body,
      creator: req.user.id,
      lessons: req.body.lessons || [] // Handle empty lessons
    };

    const course = await Course.create(courseData);

    logger.info(`New course created: ${course.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });

  } catch (error) {
    logger.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Generate course with AI - Open to all learners
const generateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { topic, level, duration, learningObjectives, language = 'en' } = req.body;

    // Generate course content using AI
    const generatedContent = await aiService.generateCourse({
      topic,
      level,
      duration,
      learningObjectives,
      language
    });

    // Create course with AI-generated content
    const course = await Course.create({
      title: generatedContent.title,
      description: generatedContent.description,
      subject: topic,
      level,
      lessons: generatedContent.lessons,
      learningObjectives: generatedContent.learningObjectives || learningObjectives,
      prerequisites: generatedContent.prerequisites || [],
      tags: generatedContent.tags || [topic],
      aiGenerated: true,
      generationPrompt: `Topic: ${topic}, Level: ${level}, Duration: ${duration}`,
      creator: req.user.id, // Changed from instructor to creator
      metadata: {
        estimatedCompletionTime: duration,
        language
      }
    });

    logger.info(`AI course generated: ${course.title} for topic: ${topic}`);

    res.status(201).json({
      success: true,
      message: 'Course generated successfully',
      data: { course }
    });

  } catch (error) {
    logger.error('Generate course error:', error);
    
    // Handle specific AI service errors
    if (error.message.includes('OpenAI API')) {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while generating course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update course - Only creator or admin
const updateCourse = async (req, res) => {
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
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('creator', 'name avatar');

    logger.info(`Course updated: ${updatedCourse.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course: updatedCourse }
    });

  } catch (error) {
    logger.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete course - Only creator or admin
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = req.resource; // From checkResourceOwnership middleware

    await Course.findByIdAndDelete(id);

    logger.info(`Course deleted: ${course.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    logger.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's accessed courses (auto-tracked)
const getEnrolledCourses = async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({ user: req.user.id })
      .populate({
        path: 'courses.course',
        select: 'title description subject level thumbnail totalDuration creator isPublished',
        populate: {
          path: 'creator',
          select: 'name avatar'
        }
      });

    if (!userProgress) {
      return res.json({
        success: true,
        data: { courses: [] }
      });
    }

    // Filter out unpublished courses and format response
    const enrolledCourses = userProgress.courses
      .filter(courseProgress => courseProgress.course && courseProgress.course.isPublished)
      .map(courseProgress => ({
        course: courseProgress.course,
        progress: {
          status: courseProgress.status,
          progressPercentage: courseProgress.progressPercentage,
          enrolledAt: courseProgress.enrolledAt,
          lastAccessedAt: courseProgress.lastAccessedAt,
          totalTimeSpent: courseProgress.totalTimeSpent
        }
      }));

    res.json({
      success: true,
      data: { courses: enrolledCourses }
    });

  } catch (error) {
    logger.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching enrolled courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add lesson to course - Only creator or admin
const addLesson = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const course = req.resource; // From checkResourceOwnership middleware

    await course.addLesson(req.body);

    logger.info(`Lesson added to course: ${course.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Lesson added successfully',
      data: { course }
    });

  } catch (error) {
    logger.error('Add lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding lesson',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  generateCourse,
  updateCourse,
  deleteCourse,
  getEnrolledCourses,
  addLesson
};
