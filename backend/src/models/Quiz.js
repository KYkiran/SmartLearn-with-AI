// backend/src/models/Quiz.js
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.lessons', // Reference to specific lesson
    default: null // null means it's a course-wide quiz
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-blank', 'essay'],
      default: 'multiple-choice'
    },
    options: [{
      text: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }],
    correctAnswer: String, // For non-multiple choice questions
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    points: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  totalPoints: {
    type: Number,
    required: true
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  timeLimit: {
    type: Number, // in minutes
    default: null // null = no time limit
  },
  attempts: {
    allowed: {
      type: Number,
      default: 3,
      min: 1
    },
    current: {
      type: Number,
      default: 0
    }
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: true
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showScore: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  quizType: {
    type: String,
    enum: ['lesson', 'course', 'practice'],
    default: 'course'
  }
}, {
  timestamps: true
});

// Indexes
quizSchema.index({ course: 1, lesson: 1 });
quizSchema.index({ course: 1, quizType: 1 });
quizSchema.index({ creator: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
