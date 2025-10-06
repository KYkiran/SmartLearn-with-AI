// backend/src/models/QuizAttempt.js
const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answer: mongoose.Schema.Types.Mixed, // Can be string, array, etc.
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number,
      default: 0 // in seconds
    }
  }],
  score: {
    points: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    passed: {
      type: Boolean,
      required: true
    }
  },
  timeSpent: {
    type: Number,
    default: 0 // total time in seconds
  },
  startedAt: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'abandoned'],
    default: 'completed'
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
quizAttemptSchema.index({ quiz: 1, user: 1 });
quizAttemptSchema.index({ user: 1, createdAt: -1 });
quizAttemptSchema.index({ quiz: 1, createdAt: -1 });

// Virtual for attempt duration
quizAttemptSchema.virtual('duration').get(function() {
  if (this.completedAt && this.startedAt) {
    return Math.floor((this.completedAt - this.startedAt) / 1000); // in seconds
  }
  return 0;
});

// Static method to get user's best score for a quiz
quizAttemptSchema.statics.getBestScore = function(userId, quizId) {
  return this.findOne({
    user: userId,
    quiz: quizId,
    status: 'completed'
  }).sort({ 'score.percentage': -1 });
};

// Static method to get user's attempt count for a quiz
quizAttemptSchema.statics.getAttemptCount = function(userId, quizId) {
  return this.countDocuments({
    user: userId,
    quiz: quizId
  });
};

// Instance method to check if this is a passing attempt
quizAttemptSchema.methods.isPassing = function(passingScore = 70) {
  return this.score.percentage >= passingScore;
};

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
