// backend/src/models/UserProgress.js
const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  courses: [{
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
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    lessonsProgress: [{
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
        type: Number,
        default: 0 // in minutes
      },
      completedAt: {
        type: Date
      },
      notes: [{
        content: String,
        timestamp: Number, // Position in lesson content
        createdAt: {
          type: Date,
          default: Date.now
        }
      }],
      bookmarks: [{
        timestamp: Number, // Position in lesson content
        note: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }]
    }]
  }],
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
      type: Number,
      default: 0 // in minutes
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
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  achievements: [{
    type: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  preferences: {
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
    },
    learningReminders: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'weekly'
      },
      time: {
        type: String,
        default: '09:00'
      }
    }
  }
}, {
  timestamps: true
});

// Indexes
userProgressSchema.index({ user: 1 });
userProgressSchema.index({ 'courses.course': 1 });
userProgressSchema.index({ 'overallStats.totalCoursesCompleted': -1 });

// Virtual for completion rate
userProgressSchema.virtual('completionRate').get(function() {
  if (this.overallStats.totalCoursesEnrolled === 0) return 0;
  return (this.overallStats.totalCoursesCompleted / this.overallStats.totalCoursesEnrolled) * 100;
});

// Static method to update course enrollment
userProgressSchema.statics.enrollInCourse = async function(userId, courseId) {
  const progress = await this.findOneAndUpdate(
    { user: userId },
    {
      $push: {
        courses: {
          course: courseId,
          status: 'enrolled',
          enrolledAt: new Date(),
          lastAccessedAt: new Date()
        }
      },
      $inc: { 'overallStats.totalCoursesEnrolled': 1 }
    },
    { upsert: true, new: true }
  );
  return progress;
};

// Static method to update lesson progress
userProgressSchema.statics.updateLessonProgress = async function(userId, courseId, lessonId, status, timeSpent = 0) {
  const update = {
    'courses.$.lastAccessedAt': new Date(),
    'overallStats.lastStudyDate': new Date()
  };

  if (timeSpent > 0) {
    update['$inc'] = {
      'courses.$.totalTimeSpent': timeSpent,
      'overallStats.totalTimeSpent': timeSpent
    };
  }

  // Update or create lesson progress
  const progress = await this.findOneAndUpdate(
    {
      user: userId,
      'courses.course': courseId,
      'courses.lessonsProgress.lesson': { $ne: lessonId }
    },
    {
      ...update,
      $push: {
        'courses.$.lessonsProgress': {
          lesson: lessonId,
          status: status,
          timeSpent: timeSpent,
          completedAt: status === 'completed' ? new Date() : undefined
        }
      }
    },
    { new: true }
  );

  if (!progress) {
    // Update existing lesson progress
    await this.findOneAndUpdate(
      {
        user: userId,
        'courses.course': courseId,
        'courses.lessonsProgress.lesson': lessonId
      },
      {
        ...update,
        'courses.$.lessonsProgress.$.status': status,
        'courses.$.lessonsProgress.$.completedAt': status === 'completed' ? new Date() : undefined,
        $inc: {
          'courses.$.lessonsProgress.$.timeSpent': timeSpent,
          'courses.$.totalTimeSpent': timeSpent,
          'overallStats.totalTimeSpent': timeSpent
        }
      }
    );
  }

  return this.findOne({ user: userId });
};

// Instance method to add achievement
userProgressSchema.methods.addAchievement = function(type, description, metadata = {}) {
  // Check if achievement already exists
  const existingAchievement = this.achievements.find(a => a.type === type);
  if (existingAchievement) return false;

  this.achievements.push({
    type,
    description,
    metadata,
    earnedAt: new Date()
  });

  return true;
};

module.exports = mongoose.model('UserProgress', userProgressSchema);
