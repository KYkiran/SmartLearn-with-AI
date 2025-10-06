// backend/src/controllers/courseController.js
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const geminiService = require('../services/geminiService');

// Get all courses
const getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      subject,
      level,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { isPublished: true };
    
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(filter)
      .populate('creator', 'name avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

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

// Get single course
const getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('creator', 'name avatar bio')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // If user is authenticated, check their progress
    let userProgress = null;
    if (req.user) {
      userProgress = await UserProgress.findOne({
        user: req.user.id,
        'courses.course': id
      });

      if (userProgress) {
        const courseProgress = userProgress.courses.find(
          c => c.course.toString() === id
        );
        userProgress = courseProgress;
      }
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

// Create course
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
      lessons: req.body.lessons || []
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

// Generate course with Gemini AI
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

    const { topic, level, duration, learningObjectives, language } = req.body;

    logger.info(`Generating course with Gemini: ${topic} (${level}, ${duration}h) for user ${req.user.email}`);

    // Generate course using Gemini
    const generatedCourse = await geminiService.generateCourse(
      topic,
      level,
      duration,
      learningObjectives,
      language
    );

    // Add user as creator
    const courseData = {
      ...generatedCourse,
      creator: req.user.id,
      isPublished: true // Auto-publish AI generated courses
    };

    const course = await Course.create(courseData);

    logger.info(`Gemini-generated course created: ${course.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Course generated successfully with Gemini AI',
      data: { course }
    });

  } catch (error) {
    logger.error('Generate course error:', error);
    
    let errorMessage = 'Failed to generate course';
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

// Update course
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
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check ownership or admin role
    if (course.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
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

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check ownership or admin role
    if (course.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    await Course.findByIdAndDelete(id);

    // Clean up user progress for this course
    await UserProgress.updateMany(
      { 'courses.course': id },
      { $pull: { courses: { course: id } } }
    );

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

// Get enrolled courses for user
const getEnrolledCourses = async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({ user: req.user.id })
      .populate({
        path: 'courses.course',
        select: 'title description subject level thumbnail totalDuration creator',
        populate: {
          path: 'creator',
          select: 'name avatar'
        }
      });

    const enrolledCourses = userProgress ? userProgress.courses : [];

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

// Add lesson to course
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

    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check ownership or admin role
    if (course.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add lessons to this course'
      });
    }

    const newLesson = {
      ...req.body,
      order: course.lessons.length + 1
    };

    course.lessons.push(newLesson);
    course.totalDuration = course.lessons.reduce((total, lesson) => total + lesson.duration, 0);

    await course.save();

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
