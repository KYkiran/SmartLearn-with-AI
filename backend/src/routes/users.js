const express = require('express');
const { query, body } = require('express-validator');

const {
  getUserProgress,
  updateCourseProgress,
  getLeaderboard,
  getUserAchievements,
  getUserStats,
  updateLessonProgress,
  addBookmark,
  removeBookmark,
  addNote,
  updateNote,
  deleteNote,
  getUserDashboard
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const progressValidation = [
  body('status')
    .optional()
    .isIn(['enrolled', 'in-progress', 'completed', 'dropped'])
    .withMessage('Invalid status'),
  body('progressPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be non-negative')
];

const lessonProgressValidation = [
  body('lessonId')
    .isMongoId()
    .withMessage('Valid lesson ID is required'),
  body('status')
    .isIn(['not-started', 'in-progress', 'completed'])
    .withMessage('Invalid lesson status'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be non-negative')
];

const bookmarkValidation = [
  body('lessonId')
    .isMongoId()
    .withMessage('Valid lesson ID is required'),
  body('timestamp')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Timestamp must be non-negative'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters')
];

const noteValidation = [
  body('lessonId')
    .isMongoId()
    .withMessage('Valid lesson ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Note content must be between 1 and 2000 characters')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// User progress routes
router.get('/progress', protect, getUserProgress);
router.put('/progress/:courseId', protect, progressValidation, updateCourseProgress);
router.put('/progress/:courseId/lesson', protect, lessonProgressValidation, updateLessonProgress);

// User stats and achievements
router.get('/stats', protect, getUserStats);
router.get('/achievements', protect, getUserAchievements);
router.get('/dashboard', protect, getUserDashboard);

// Bookmarks
router.post('/bookmarks', protect, bookmarkValidation, addBookmark);
router.delete('/bookmarks/:bookmarkId', protect, removeBookmark);

// Notes
router.post('/notes', protect, noteValidation, addNote);
router.put('/notes/:noteId', protect, noteValidation, updateNote);
router.delete('/notes/:noteId', protect, deleteNote);

// Leaderboard (public but requires auth)
router.get('/leaderboard', protect, queryValidation, getLeaderboard);

// Admin routes
router.get('/:userId/progress', protect, authorize('admin'), getUserProgress);

module.exports = router;
