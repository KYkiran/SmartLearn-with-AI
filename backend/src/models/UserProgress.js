const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
});

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: mongoose.Schema.Types.Mixed, // Can be string, array, etc.
    isCorrect: Boolean,
    timeSpent: Number // seconds spent on this question
  }],
  score: {
    points: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    }
  },
  timeSpent: {
    type: Number, // total time in minutes
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'abandoned'],
    default: 'started'
  }
});

const courseProgressSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lessonsProgress: [lessonProgressSchema],
  quizAttempts: [quizAttemptSchema],
  certificates: [{
    certificateId: String,
    issuedAt: Date,
    downloadUrl: String
  }],
  notes: [{
    lesson: mongoose.Schema.Types.ObjectId,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lesson: mongoose.Schema.Types.ObjectId,
    timestamp: Number, // For video bookmarks
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  courses: [courseProgressSchema],
  overallStats: {
    totalCoursesEnrolled: {
      type: Number,
      default: 0
    },
    totalCoursesCompleted: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number, // in minutes
      default: 0
    },
    totalQuizzesTaken: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    lastStudyDate: {
      type: Date
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first-course', 'course-completed', 'quiz-master', 'streak-7', 'streak-30', 'fast-learner']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  preferences: {
    studyReminders: {
      enabled: {
        type: Boolean,
        default: false
      },
      time: String, // "14:30"
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    emailNotifications: {
      courseUpdates: {
        type: Boolean,
        default: true
      },
      quizReminders: {
        type: Boolean,
        default: true
      },
      achievements: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
userProgressSchema.index({ user: 1 });
userProgressSchema.index({ 'courses.course': 1 });
userProgressSchema.index({ 'courses.status': 1 });
userProgressSchema.index({ 'overallStats.lastStudyDate': -1 });

// Method to get course progress
userProgressSchema.methods.getCourseProgress = function(courseId) {
  return this.courses.find(course => course.course.toString() === courseId.toString());
};

// Method to update course progress
userProgressSchema.methods.updateCourseProgress = function(courseId, updateData) {
  const courseProgress = this.getCourseProgress(courseId);
  
  if (courseProgress) {
    Object.assign(courseProgress, updateData);
  } else {
    this.courses.push({ course: courseId, ...updateData });
    this.overallStats.totalCoursesEnrolled += 1;
  }
  
  this.updateOverallStats();
  return this.save();
};

// Method to add quiz attempt
userProgressSchema.methods.addQuizAttempt = function(courseId, quizAttempt) {
  const courseProgress = this.getCourseProgress(courseId);
  if (courseProgress) {
    courseProgress.quizAttempts.push(quizAttempt);
    this.overallStats.totalQuizzesTaken += 1;
    this.updateOverallStats();
  }
  return this.save();
};

// Method to update overall stats
userProgressSchema.methods.updateOverallStats = function() {
  // Calculate total time spent
  this.overallStats.totalTimeSpent = this.courses.reduce((total, course) => {
    return total + course.totalTimeSpent;
  }, 0);
  
  // Calculate completed courses
  this.overallStats.totalCoursesCompleted = this.courses.filter(
    course => course.status === 'completed'
  ).length;
  
  // Calculate average quiz score
  const allQuizAttempts = this.courses.flatMap(course => course.quizAttempts);
  if (allQuizAttempts.length > 0) {
    const totalScore = allQuizAttempts.reduce((sum, attempt) => sum + attempt.score.percentage, 0);
    this.overallStats.averageQuizScore = totalScore / allQuizAttempts.length;
  }
  
  // Update last study date
  this.overallStats.lastStudyDate = new Date();
  
  // Calculate streak (simplified - you might want more complex logic)
  const today = new Date();
  const lastStudy = this.overallStats.lastStudyDate;
  if (lastStudy) {
    const diffDays = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      this.overallStats.streakDays += 1;
    } else {
      this.overallStats.streakDays = 1;
    }
  } else {
    this.overallStats.streakDays = 1;
  }
};

// Method to check and award achievements
userProgressSchema.methods.checkAchievements = function() {
  const newAchievements = [];
  
  // First course achievement
  if (this.overallStats.totalCoursesEnrolled === 1 && 
      !this.achievements.find(a => a.type === 'first-course')) {
    newAchievements.push({ type: 'first-course' });
  }
  
  // Course completion achievement
  if (this.overallStats.totalCoursesCompleted > 0 && 
      !this.achievements.find(a => a.type === 'course-completed')) {
    newAchievements.push({ type: 'course-completed' });
  }
  
  // Quiz master achievement (average score > 90%)
  if (this.overallStats.averageQuizScore > 90 && 
      this.overallStats.totalQuizzesTaken >= 5 &&
      !this.achievements.find(a => a.type === 'quiz-master')) {
    newAchievements.push({ type: 'quiz-master' });
  }
  
  // Streak achievements
  if (this.overallStats.streakDays >= 7 && 
      !this.achievements.find(a => a.type === 'streak-7')) {
    newAchievements.push({ type: 'streak-7' });
  }
  
  if (this.overallStats.streakDays >= 30 && 
      !this.achievements.find(a => a.type === 'streak-30')) {
    newAchievements.push({ type: 'streak-30' });
  }
  
  // Add new achievements
  this.achievements.push(...newAchievements);
  
  return newAchievements;
};

// Static method to get leaderboard
userProgressSchema.statics.getLeaderboard = function(limit = 10) {
  return this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        'userInfo.name': 1,
        'userInfo.avatar': 1,
        'overallStats.totalCoursesCompleted': 1,
        'overallStats.totalTimeSpent': 1,
        'overallStats.averageQuizScore': 1,
        'overallStats.streakDays': 1
      }
    },
    { $sort: { 'overallStats.totalCoursesCompleted': -1, 'overallStats.averageQuizScore': -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
