const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

// Initialize OpenAI client
const openai = config.OPENAI_API_KEY ? new OpenAI({
  apiKey: config.OPENAI_API_KEY,
}) : null;

class AIService {
  constructor() {
    if (!openai) {
      logger.warn('OpenAI API key not provided. AI features will not work.');
    }
  }

  // Check if AI service is available
  isAvailable() {
    return openai !== null;
  }

  // Generate course content
  async generateCourse({ topic, level, duration, learningObjectives, language = 'en' }) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = this.buildCoursePrompt({
        topic,
        level,
        duration,
        learningObjectives,
        language
      });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator. Generate comprehensive course content in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(response.choices[0].message.content);
      
      // Validate and format the response
      return this.formatCourseContent(content);

    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  // Generate quiz questions
  async generateQuiz({ courseContent, difficulty, numQuestions, questionTypes = ['multiple-choice'] }) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = this.buildQuizPrompt({
        courseContent,
        difficulty,
        numQuestions,
        questionTypes
      });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating educational assessments. Generate quiz questions in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(response.choices[0].message.content);
      
      return this.formatQuizContent(content);

    } catch (error) {
      logger.error('OpenAI quiz generation error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  // Generate personalized learning path
  async generateLearningPath({ userLevel, interests, goals, timeAvailable }) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `Create a personalized learning path for a ${userLevel} level learner.
      
      Interests: ${interests.join(', ')}
      Goals: ${goals}
      Time available: ${timeAvailable} hours per week
      
      Generate a structured learning path with recommended courses, timeline, and milestones in JSON format.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a learning advisor. Create personalized learning paths in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      logger.error('OpenAI learning path error:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  // Build course generation prompt
  buildCoursePrompt({ topic, level, duration, learningObjectives, language }) {
    const estimatedLessons = Math.max(3, Math.floor(duration / 2));
    
    return `Create a comprehensive course about "${topic}" for ${level} level learners.

Course Requirements:
- Target Level: ${level}
- Duration: ${duration} hours total
- Number of Lessons: ${estimatedLessons}
- Language: ${language}
${learningObjectives ? `- Learning Objectives: ${learningObjectives.join(', ')}` : ''}

Generate the course in this exact JSON structure:
{
  "title": "Course Title",
  "description": "Detailed course description (100-200 words)",
  "lessons": [
    {
      "title": "Lesson 1 Title",
      "content": "Comprehensive lesson content (500-1000 words)",
      "duration": 30,
      "type": "text",
      "order": 1,
      "resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com",
          "type": "link"
        }
      ]
    }
  ],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "tags": ["tag1", "tag2", "tag3"]
}

Ensure the content is educational, well-structured, and appropriate for the ${level} level.`;
  }

  // Build quiz generation prompt
  buildQuizPrompt({ courseContent, difficulty, numQuestions, questionTypes }) {
    return `Create ${numQuestions} quiz questions based on this course content:

${courseContent}

Requirements:
- Difficulty: ${difficulty}
- Question Types: ${questionTypes.join(', ')}
- Include explanations for correct answers

Generate in this exact JSON structure:
{
  "questions": [
    {
      "question": "Question text",
      "type": "multiple-choice",
      "options": [
        {"text": "Option A", "isCorrect": false},
        {"text": "Option B", "isCorrect": true},
        {"text": "Option C", "isCorrect": false},
        {"text": "Option D", "isCorrect": false}
      ],
      "explanation": "Why this answer is correct",
      "difficulty": "${difficulty}",
      "points": 1
    }
  ]
}`;
  }

  // Format course content
  formatCourseContent(content) {
    // Ensure required fields exist
    const formatted = {
      title: content.title || 'Untitled Course',
      description: content.description || 'Course description not provided',
      lessons: [],
      learningObjectives: content.learningObjectives || [],
      prerequisites: content.prerequisites || [],
      tags: content.tags || []
    };

    // Format lessons
    if (content.lessons && Array.isArray(content.lessons)) {
      formatted.lessons = content.lessons.map((lesson, index) => ({
        title: lesson.title || `Lesson ${index + 1}`,
        content: lesson.content || 'Lesson content not provided',
        duration: lesson.duration || 30,
        type: lesson.type || 'text',
        order: lesson.order || index + 1,
        resources: lesson.resources || []
      }));
    }

    return formatted;
  }

  // Format quiz content
  formatQuizContent(content) {
    const formatted = {
      questions: []
    };

    if (content.questions && Array.isArray(content.questions)) {
      formatted.questions = content.questions.map(question => ({
        question: question.question || 'Question not provided',
        type: question.type || 'multiple-choice',
        options: question.options || [],
        explanation: question.explanation || '',
        difficulty: question.difficulty || 'medium',
        points: question.points || 1,
        tags: question.tags || []
      }));
    }

    return formatted;
  }

  // Analyze user learning patterns (placeholder for future ML integration)
  async analyzeLearningPatterns(userProgressData) {
    // This could be enhanced with actual ML models
    const analysis = {
      strongSubjects: [],
      weakSubjects: [],
      learningStyle: 'visual', // Could be determined by user behavior
      recommendedDifficulty: 'medium',
      suggestedStudyTime: 2 // hours per day
    };

    return analysis;
  }
}

module.exports = new AIService();
