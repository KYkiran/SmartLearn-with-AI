const express = require('express');
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const {
  getCourses,
  getCourse,
  createCourse,
  generateCourse,
  updateCourse,
  deleteCourse,
  getEnrolledCourses,
  addLesson
} = require('../controllers/courseController');

const { protect, optionalAuth, adminOnly, checkResourceOwnership } = require('../middleware/auth');
const Course = require('../models/Course');

const router = express.Router();

// Rate limiting for AI generation
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 AI generations per hour
  message: {
    success: false,
    message: 'AI generation rate limit exceeded. Please try again later.'
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Validation rules - FIXED
const courseValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Course title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Course description must be between 10 and 1000 characters'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  body('learningObjectives')
    .optional()
    .isArray()
    .withMessage('Learning objectives must be an array'),
  
  // FIXED: Only validate lessons if they exist
  body('lessons')
    .optional()
    .isArray()
    .withMessage('Lessons must be an array'),
  
  // REMOVED: Remove all nested lesson validation for course creation
  // The lesson validation will be handled in the addLesson route instead
];


const generateCourseValidation = [
  body('topic')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Topic must be between 3 and 100 characters'),
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  body('duration')
    .isInt({ min: 1, max: 100 })
    .withMessage('Duration must be between 1 and 100 hours'),
  body('learningObjectives')
    .optional()
    .isArray()
    .withMessage('Learning objectives must be an array'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters')
];

const lessonValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Lesson title must be between 3 and 100 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Lesson content must be at least 10 characters'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('type')
    .optional()
    .isIn(['text', 'video', 'interactive'])
    .withMessage('Lesson type must be text, video, or interactive')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'enrollmentCount', 'rating.average'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Public routes - anyone can view published courses
router.get('/', queryValidation, optionalAuth, getCourses);
router.get('/:id', optionalAuth, getCourse);

// Protected routes - any authenticated learner can create content
router.post('/', protect, courseValidation, createCourse);
router.post('/generate', protect, aiLimiter, generateCourseValidation, generateCourse);
router.get('/user/enrolled', protect, getEnrolledCourses);

// Protected routes - only course creator or admin can modify
router.put('/:id', protect, checkResourceOwnership(Course), courseValidation, updateCourse);
router.delete('/:id', protect, checkResourceOwnership(Course), deleteCourse);
router.post('/:id/lessons', protect, checkResourceOwnership(Course), lessonValidation, addLesson);

// Add this BEFORE the existing routes
router.post('/debug', protect, (req, res) => {
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  console.log('Headers:', req.headers);
  
  res.json({
    success: true,
    message: 'Debug route works',
    receivedBody: req.body,
    bodyKeys: Object.keys(req.body),
    user: req.user ? req.user.name : 'No user',
    contentType: req.headers['content-type']
  });
});

module.exports = router;
