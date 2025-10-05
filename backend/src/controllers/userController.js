const UserProgress = require('../models/UserProgress');
const Course = require('../models/Course');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Get user progress
const getUserProgress = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Check if user is trying to access someone else's progress
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const userProgress = await UserProgress.findOne({ user: userId })
      .populate({
        path: 'courses.course',
        select: 'title description subject level thumbnail totalDuration instructor',
        populate: {
          path: 'instructor',
          select: 'name avatar'
        }
      });

    if (!userProgress) {
      return res.json({
        success: true,
        data: {
          courses: [],
          overallStats: {
            totalCoursesEnrolled: 0,
            totalCoursesCompleted: 0,
            totalTimeSpent: 0,
            totalQuizzesTaken: 0,
            averageQuizScore: 0,
            streakDays: 0,
            lastStudyDate: null
          },
          achievements: []
        }
      });
    }

    res.json({
      success: true,
      data: userProgress
    });

  } catch (error) {
    logger.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update course progress
const updateCourseProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId } = req.params;
    const updateData = req.body;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get or create user progress
    let userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      userProgress = await UserProgress.create({ user: req.user.id });
    }

    // Update course progress
    await userProgress.updateCourseProgress(courseId, updateData);

    // Check for new achievements
    const newAchievements = userProgress.checkAchievements();

    logger.info(`Course progress updated: ${req.user.email} -> ${course.title}`);

    res.json({
      success: true,
      message: 'Course progress updated successfully',
      data: {
        courseProgress: userProgress.getCourseProgress(courseId),
        newAchievements
      }
    });

  } catch (error) {
    logger.error('Update course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update lesson progress
const updateLessonProgress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { courseId } = req.params;
    const { lessonId, status, timeSpent } = req.body;

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    const courseProgress = userProgress.getCourseProgress(courseId);
    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Find or create lesson progress
    let lessonProgress = courseProgress.lessonsProgress.find(
      lp => lp.lesson.toString() === lessonId
    );

    if (lessonProgress) {
      lessonProgress.status = status;
      lessonProgress.timeSpent += timeSpent || 0;
      lessonProgress.lastAccessedAt = new Date();
      if (status === 'completed' && !lessonProgress.completedAt) {
        lessonProgress.completedAt = new Date();
      }
    } else {
      lessonProgress = {
        lesson: lessonId,
        status,
        timeSpent: timeSpent || 0,
        lastAccessedAt: new Date(),
        completedAt: status === 'completed' ? new Date() : undefined
      };
      courseProgress.lessonsProgress.push(lessonProgress);
    }

    // Update course progress percentage
    const completedLessons = courseProgress.lessonsProgress.filter(
      lp => lp.status === 'completed'
    ).length;
    
    const course = await Course.findById(courseId);
    if (course) {
      courseProgress.progressPercentage = Math.round(
        (completedLessons / course.lessons.length) * 100
      );
      
      // Update course status based on progress
      if (courseProgress.progressPercentage === 100) {
        courseProgress.status = 'completed';
        courseProgress.completedAt = new Date();
      } else if (courseProgress.progressPercentage > 0) {
        courseProgress.status = 'in-progress';
        if (!courseProgress.startedAt) {
          courseProgress.startedAt = new Date();
        }
      }
    }

    // Update total time spent
    courseProgress.totalTimeSpent = courseProgress.lessonsProgress.reduce(
      (total, lp) => total + lp.timeSpent, 0
    );
    courseProgress.lastAccessedAt = new Date();

    // Update overall stats
    userProgress.updateOverallStats();

    await userProgress.save();

    // Check for achievements
    const newAchievements = userProgress.checkAchievements();

    res.json({
      success: true,
      message: 'Lesson progress updated successfully',
      data: {
        lessonProgress,
        courseProgress: {
          progressPercentage: courseProgress.progressPercentage,
          status: courseProgress.status,
          totalTimeSpent: courseProgress.totalTimeSpent
        },
        newAchievements
      }
    });

  } catch (error) {
    logger.error('Update lesson progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating lesson progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const leaderboard = await UserProgress.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      data: { leaderboard }
    });

  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user achievements
const getUserAchievements = async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({ user: req.user.id });
    
    if (!userProgress) {
      return res.json({
        success: true,
        data: { achievements: [] }
      });
    }

    const achievements = userProgress.achievements.map(achievement => ({
      ...achievement.toObject(),
      title: getAchievementTitle(achievement.type),
      description: getAchievementDescription(achievement.type),
      icon: getAchievementIcon(achievement.type)
    }));

    res.json({
      success: true,
      data: { achievements }
    });

  } catch (error) {
    logger.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching achievements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({ user: req.user.id });
    
    if (!userProgress) {
      return res.json({
        success: true,
        data: {
          overallStats: {
            totalCoursesEnrolled: 0,
            totalCoursesCompleted: 0,
            totalTimeSpent: 0,
            totalQuizzesTaken: 0,
            averageQuizScore: 0,
            streakDays: 0,
            lastStudyDate: null
          },
          weeklyStats: [],
          subjectStats: []
        }
      });
    }

    // Calculate weekly study time (last 7 days)
    const weeklyStats = await calculateWeeklyStats(userProgress);
    
    // Calculate subject-wise progress
    const subjectStats = await calculateSubjectStats(userProgress);

    res.json({
      success: true,
      data: {
        overallStats: userProgress.overallStats,
        weeklyStats,
        subjectStats
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add bookmark
const addBookmark = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lessonId, timestamp, note } = req.body;

    // Find the course that contains this lesson
    const course = await Course.findOne({ 'lessons._id': lessonId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    const courseProgress = userProgress.getCourseProgress(course._id);
    if (!courseProgress) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    const bookmark = {
      lesson: lessonId,
      timestamp: timestamp || 0,
      note: note || '',
      createdAt: new Date()
    };

    courseProgress.bookmarks.push(bookmark);
    await userProgress.save();

    res.status(201).json({
      success: true,
      message: 'Bookmark added successfully',
      data: { bookmark }
    });

  } catch (error) {
    logger.error('Add bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding bookmark',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove bookmark
const removeBookmark = async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    // Find and remove bookmark
    let bookmarkFound = false;
    userProgress.courses.forEach(courseProgress => {
      const bookmarkIndex = courseProgress.bookmarks.findIndex(
        bookmark => bookmark._id.toString() === bookmarkId
      );
      if (bookmarkIndex > -1) {
        courseProgress.bookmarks.splice(bookmarkIndex, 1);
        bookmarkFound = true;
      }
    });

    if (!bookmarkFound) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    await userProgress.save();

    res.json({
      success: true,
      message: 'Bookmark removed successfully'
    });

  } catch (error) {
    logger.error('Remove bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing bookmark',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add note
const addNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lessonId, content } = req.body;

    // Find the course that contains this lesson
    const course = await Course.findOne({ 'lessons._id': lessonId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    const courseProgress = userProgress.getCourseProgress(course._id);
    if (!courseProgress) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    const note = {
      lesson: lessonId,
      content,
      createdAt: new Date()
    };

    courseProgress.notes.push(note);
    await userProgress.save();

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: { note }
    });

  } catch (error) {
    logger.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update note
const updateNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { noteId } = req.params;
    const { content } = req.body;

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    // Find and update note
    let noteFound = false;
    userProgress.courses.forEach(courseProgress => {
      const note = courseProgress.notes.findIndex(
        note => note._id.toString() === noteId
      );
      if (note > -1) {
        courseProgress.notes[note].content = content;
        noteFound = true;
      }
    });

    if (!noteFound) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await userProgress.save();

    res.json({
      success: true,
      message: 'Note updated successfully'
    });

  } catch (error) {
    logger.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete note
const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const userProgress = await UserProgress.findOne({ user: req.user.id });
    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'User progress not found'
      });
    }

    // Find and remove note
    let noteFound = false;
    userProgress.courses.forEach(courseProgress => {
      const noteIndex = courseProgress.notes.findIndex(
        note => note._id.toString() === noteId
      );
      if (noteIndex > -1) {
        courseProgress.notes.splice(noteIndex, 1);
        noteFound = true;
      }
    });

    if (!noteFound) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await userProgress.save();

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    logger.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user dashboard
const getUserDashboard = async (req, res) => {
  try {
    const userProgress = await UserProgress.findOne({ user: req.user.id })
      .populate({
        path: 'courses.course',
        select: 'title subject level thumbnail totalDuration'
      });

    if (!userProgress) {
      return res.json({
        success: true,
        data: {
          recentCourses: [],
          upcomingQuizzes: [],
          achievements: [],
          stats: {
            totalCoursesEnrolled: 0,
            totalCoursesCompleted: 0,
            totalTimeSpent: 0,
            streakDays: 0
          }
        }
      });
    }

    // Get recent courses (last accessed)
    const recentCourses = userProgress.courses
      .filter(cp => cp.course)
      .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
      .slice(0, 5)
      .map(cp => ({
        course: cp.course,
        progress: cp.progressPercentage,
        status: cp.status,
        lastAccessed: cp.lastAccessedAt
      }));

    // Get recent achievements
    const recentAchievements = userProgress.achievements
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .slice(0, 3)
      .map(achievement => ({
        ...achievement.toObject(),
        title: getAchievementTitle(achievement.type),
        description: getAchievementDescription(achievement.type)
      }));

    res.json({
      success: true,
      data: {
        recentCourses,
        achievements: recentAchievements,
        stats: userProgress.overallStats
      }
    });

  } catch (error) {
    logger.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper functions
const getAchievementTitle = (type) => {
  const titles = {
    'first-course': 'First Course',
    'course-completed': 'Course Completed',
    'quiz-master': 'Quiz Master',
    'streak-7': '7-Day Streak',
    'streak-30': '30-Day Streak',
    'fast-learner': 'Fast Learner'
  };
  return titles[type] || 'Achievement';
};

const getAchievementDescription = (type) => {
  const descriptions = {
    'first-course': 'Enrolled in your first course',
    'course-completed': 'Completed your first course',
    'quiz-master': 'Achieved 90%+ average on quizzes',
    'streak-7': 'Maintained a 7-day learning streak',
    'streak-30': 'Maintained a 30-day learning streak',
    'fast-learner': 'Completed a course in record time'
  };
  return descriptions[type] || 'Achievement unlocked';
};

const getAchievementIcon = (type) => {
  const icons = {
    'first-course': '🎓',
    'course-completed': '✅',
    'quiz-master': '🧠',
    'streak-7': '🔥',
    'streak-30': '💯',
    'fast-learner': '⚡'
  };
  return icons[type] || '🏆';
};

const calculateWeeklyStats = async (userProgress) => {
  // This is a simplified version - in production you might want to store daily activity
  const weeklyStats = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simplified calculation - you might want to implement actual daily tracking
    weeklyStats.push({
      date: date.toISOString().split('T')[0],
      timeSpent: Math.random() * 60, // Placeholder - implement actual tracking
      coursesStudied: Math.floor(Math.random() * 3)
    });
  }
  
  return weeklyStats;
};

const calculateSubjectStats = async (userProgress) => {
  const subjectMap = new Map();
  
  for (const courseProgress of userProgress.courses) {
    if (courseProgress.course && courseProgress.course.subject) {
      const subject = courseProgress.course.subject;
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, {
          subject,
          totalCourses: 0,
          completedCourses: 0,
          totalTimeSpent: 0,
          averageProgress: 0
        });
      }
      
      const stats = subjectMap.get(subject);
      stats.totalCourses += 1;
      stats.totalTimeSpent += courseProgress.totalTimeSpent || 0;
      
      if (courseProgress.status === 'completed') {
        stats.completedCourses += 1;
      }
    }
  }
  
  // Calculate averages
  const subjectStats = Array.from(subjectMap.values()).map(stats => ({
    ...stats,
    averageProgress: stats.totalCourses > 0 ? 
      Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0
  }));
  
  return subjectStats;
};

module.exports = {
  getUserProgress,
  updateCourseProgress,
  updateLessonProgress,
  getLeaderboard,
  getUserAchievements,
  getUserStats,
  addBookmark,
  removeBookmark,
  addNote,
  updateNote,
  deleteNote,
  getUserDashboard
};
