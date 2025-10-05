const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'video', 'interactive'],
    default: 'text'
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['link', 'document', 'video', 'image']
    }
  }]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: null
  },
  lessons: [lessonSchema],
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningObjectives: [{
    type: String,
    trim: true
  }],
  creator: { // Changed from 'instructor' to 'creator'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  generationPrompt: {
    type: String // Store the original prompt used to generate the course
  },
  metadata: {
    estimatedCompletionTime: Number, // in hours
    targetAudience: String,
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
courseSchema.index({ subject: 1, level: 1 });
courseSchema.index({ creator: 1 }); // Updated index
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ 'rating.average': -1 });
courseSchema.index({ tags: 1 });

// Calculate total duration before saving
courseSchema.pre('save', function(next) {
  if (this.lessons && this.lessons.length > 0) {
    this.totalDuration = this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }
  
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Virtual for formatted duration
courseSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.totalDuration / 60);
  const minutes = this.totalDuration % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

// Method to add lesson
courseSchema.methods.addLesson = function(lessonData) {
  const order = this.lessons.length > 0 ? Math.max(...this.lessons.map(l => l.order)) + 1 : 1;
  this.lessons.push({ ...lessonData, order });
  return this.save();
};

// Method to update rating
courseSchema.methods.updateRating = async function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Static method to find courses by difficulty range
courseSchema.statics.findByDifficultyRange = function(minDifficulty, maxDifficulty) {
  return this.find({
    difficulty: { $gte: minDifficulty, $lte: maxDifficulty },
    isPublished: true
  });
};

module.exports = mongoose.model('Course', courseSchema);
