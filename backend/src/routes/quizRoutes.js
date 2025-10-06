const express = require('express');
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const {
  getQuizzes,
  getQuiz,
  createQuiz,
  generateQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getQuizAttempts,
  getQuizResults
} = require('../controllers/quizController');

const { protect, checkResourceOwnership } = require('../middleware/auth');
const Quiz = require('../models/Quiz');

const router = express.Router();

// Rate limiting for AI generation
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 AI generations per hour
  message: {
    success: false,
    message: 'Quiz generation rate limit exceeded. Please try again later.'
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Validation rules
const quizValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Quiz title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time limit must be a positive integer'),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.question')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Question must be at least 10 characters'),
  body('questions.*.type')
    .isIn(['multiple-choice', 'true-false', 'fill-blank', 'essay'])
    .withMessage('Invalid question type'),
  body('questions.*.difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('questions.*.points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer')
];

const generateQuizValidation = [
  body('courseId')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('numQuestions')
    .isInt({ min: 1, max: 50 })
    .withMessage('Number of questions must be between 1 and 50'),
  body('questionTypes')
    .optional()
    .isArray()
    .withMessage('Question types must be an array'),
  body('topics')
    .optional()
    .isArray()
    .withMessage('Topics must be an array')
];

const submitAttemptValidation = [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  body('startedAt')
    .optional()
    .isISO8601()
    .withMessage('Started at must be a valid date')
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
  query('course')
    .optional()
    .isMongoId()
    .withMessage('Course must be a valid ID'),
  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard')
];

// Public routes - anyone can view and take published quizzes
router.get('/', queryValidation, protect, getQuizzes);
router.get('/:id', protect, getQuiz);

// Student routes - anyone can take quizzes
router.post('/:id/attempt', protect, submitAttemptValidation, submitQuizAttempt);
router.get('/:id/attempts', protect, getQuizAttempts);
router.get('/:id/results', protect, getQuizResults);

// Creation routes - any learner can create quizzes
router.post('/', protect, quizValidation, createQuiz); // No role restriction
router.post('/generate', protect, aiLimiter, generateQuizValidation, generateQuiz); // No role restriction

// Modification routes - only creator or admin can modify
router.put('/:id', protect, checkResourceOwnership(Quiz), quizValidation, updateQuiz);
router.delete('/:id', protect, checkResourceOwnership(Quiz), deleteQuiz);

module.exports = router;
