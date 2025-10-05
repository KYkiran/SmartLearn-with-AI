const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
});

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank', 'essay'],
    default: 'multiple-choice'
  },
  options: [optionSchema],
  correctAnswer: {
    type: String, // For fill-blank and essay questions
    trim: true
  },
  explanation: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  tags: [{
    type: String,
    trim: true
  }]
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Optional: quiz can be for entire course or specific lesson
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: null // null means no time limit
  },
  attempts: {
    allowed: {
      type: Number,
      default: 3
    },
    current: {
      type: Number,
      default: 0
    }
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
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
  aiGenerated: {
    type: Boolean,
    default: true
  },
  generationPrompt: {
    type: String
  },
  creator: { // Changed from 'instructor' to 'creator'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
quizSchema.index({ course: 1 });
quizSchema.index({ creator: 1 }); // Updated index
quizSchema.index({ isPublished: 1, createdAt: -1 });

// Calculate total points before saving
quizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
  }
  
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Method to shuffle questions
quizSchema.methods.getShuffledQuestions = function() {
  if (!this.settings.shuffleQuestions) return this.questions;
  
  const shuffled = [...this.questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Also shuffle options if enabled
  if (this.settings.shuffleOptions) {
    shuffled.forEach(question => {
      if (question.options && question.options.length > 0) {
        for (let i = question.options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [question.options[i], question.options[j]] = [question.options[j], question.options[i]];
        }
      }
    });
  }
  
  return shuffled;
};

// Method to calculate score
quizSchema.methods.calculateScore = function(answers) {
  let score = 0;
  let totalPossible = 0;
  
  this.questions.forEach((question, index) => {
    totalPossible += question.points;
    
    const userAnswer = answers[index];
    if (!userAnswer) return;
    
    switch (question.type) {
      case 'multiple-choice':
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption && userAnswer === correctOption.text) {
          score += question.points;
        }
        break;
        
      case 'true-false':
        const correctTF = question.options.find(opt => opt.isCorrect);
        if (correctTF && userAnswer === correctTF.text) {
          score += question.points;
        }
        break;
        
      case 'fill-blank':
        if (question.correctAnswer && 
            userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
          score += question.points;
        }
        break;
        
      // Essay questions need manual grading
      case 'essay':
        // Skip auto-grading for essays
        break;
    }
  });
  
  return {
    score,
    totalPossible,
    percentage: totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0
  };
};

// Static method to find quizzes by difficulty
quizSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({
    'questions.difficulty': difficulty,
    isPublished: true
  });
};

module.exports = mongoose.model('Quiz', quizSchema);
