// backend/src/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  }

  async generateCourse(topic, level, duration, learningObjectives = [], language = 'en') {
    try {
      const prompt = this.buildCoursePrompt(topic, level, duration, learningObjectives, language);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up the response text to extract JSON
      let cleanedText = text.trim();
      
      // Fix: Proper regex patterns for cleaning markdown
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```$/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      
      // Additional cleanup for any remaining backticks
      cleanedText = cleanedText.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
      
      // Parse the JSON response
      const courseData = JSON.parse(cleanedText);
      
      // Validate and structure the response
      return this.validateCourseData(courseData, topic, level);
      
    } catch (error) {
      logger.error('Gemini course generation error:', error);
      
      // Enhanced error handling with more specific messages
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
      }
      throw new Error(`Failed to generate course: ${error.message}`);
    }
  }

  async generateQuiz(courseContent, difficulty, numQuestions, questionTypes = [], topics = []) {
    try {
      const prompt = this.buildQuizPrompt(courseContent, difficulty, numQuestions, questionTypes, topics);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up the response text to extract JSON
      let cleanedText = text.trim();
      
      // Fix: Proper regex patterns for cleaning markdown
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```$/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      
      // Additional cleanup for any remaining backticks
      cleanedText = cleanedText.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
      
      // Parse the JSON response
      const quizData = JSON.parse(cleanedText);
      
      // Validate and structure the response
      return this.validateQuizData(quizData, difficulty);
      
    } catch (error) {
      logger.error('Gemini quiz generation error:', error);
      
      // Enhanced error handling with more specific messages
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
      }
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  buildCoursePrompt(topic, level, duration, learningObjectives, language) {
    const objectivesText = learningObjectives.length > 0 
      ? `Learning objectives: ${learningObjectives.join(', ')}`
      : '';

    return `Generate a comprehensive course in JSON format with the following specifications:

Topic: ${topic}
Level: ${level}
Duration: ${duration} hours
${objectivesText}
Language: ${language}

Requirements:
1. Create a course with 5-8 lessons
2. Each lesson should be 15-45 minutes
3. Include practical examples and exercises
4. Make content engaging and educational
5. Include prerequisites if needed

Return ONLY valid JSON in this exact format:
{
  "title": "Course title",
  "description": "Detailed course description (100-300 words)",
  "subject": "Main subject category",
  "level": "${level}",
  "tags": ["tag1", "tag2", "tag3"],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "lessons": [
    {
      "title": "Lesson title",
      "content": "Detailed lesson content (500-1000 words with examples)",
      "duration": 30,
      "type": "text",
      "order": 1
    }
  ],
  "totalDuration": ${duration * 60},
  "aiGenerated": true
}

Important: 
- Ensure content is factual and educational
- Make lessons progressive (building on each other)
- Include real-world examples
- Content should be appropriate for ${level} level
- Return only the JSON, no additional text or markdown formatting
- Do not wrap the response in backticks or code blocks`;
  }

  buildQuizPrompt(courseContent, difficulty, numQuestions, questionTypes, topics) {
    const typesText = questionTypes.length > 0 
      ? `Question types: ${questionTypes.join(', ')}`
      : 'Question types: multiple-choice, true-false, fill-blank';
    
    const topicsText = topics.length > 0 
      ? `Focus on these topics: ${topics.join(', ')}`
      : '';

    return `Generate a quiz in JSON format based on this course content:

Course Content: ${JSON.stringify(courseContent)}

Quiz Requirements:
- Difficulty: ${difficulty}
- Number of questions: ${numQuestions}
- ${typesText}
- ${topicsText}

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz title based on course content",
  "description": "Brief quiz description",
  "timeLimit": ${difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35},
  "passingScore": ${difficulty === 'easy' ? 60 : difficulty === 'medium' ? 70 : 80},
  "questions": [
    {
      "question": "Question text here?",
      "type": "multiple-choice",
      "options": [
        {"text": "Option 1", "isCorrect": false},
        {"text": "Option 2", "isCorrect": true},
        {"text": "Option 3", "isCorrect": false},
        {"text": "Option 4", "isCorrect": false}
      ],
      "explanation": "Explanation of correct answer",
      "difficulty": "${difficulty}",
      "points": 1
    }
  ],
  "settings": {
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "showCorrectAnswers": true,
    "showScore": true,
    "allowReview": true
  },
  "aiGenerated": true
}

Important:
- Questions should test understanding, not just memorization
- Provide clear explanations for correct answers
- Ensure questions are relevant to the course content
- Mix question difficulties appropriately
- Return only the JSON, no additional text or markdown formatting
- Do not wrap the response in backticks or code blocks`;
  }

  validateCourseData(courseData, topic, level) {
    // Ensure required fields exist
    const requiredFields = ['title', 'description', 'subject', 'level', 'lessons'];
    for (const field of requiredFields) {
      if (!courseData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate lessons
    if (!Array.isArray(courseData.lessons) || courseData.lessons.length === 0) {
      throw new Error('Course must have at least one lesson');
    }

    // Validate each lesson has required fields
    courseData.lessons.forEach((lesson, index) => {
      if (!lesson.title || !lesson.content) {
        throw new Error(`Lesson ${index + 1} is missing title or content`);
      }
    });

    // Set defaults and ensure consistency
    return {
      ...courseData,
      level: level,
      aiGenerated: true,
      tags: courseData.tags || [topic.toLowerCase().replace(/\s+/g, '-')],
      prerequisites: courseData.prerequisites || [],
      learningObjectives: courseData.learningObjectives || [],
      totalDuration: courseData.lessons.reduce((total, lesson) => total + (lesson.duration || 30), 0),
      lessons: courseData.lessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
        type: lesson.type || 'text',
        duration: lesson.duration || 30
      }))
    };
  }

  validateQuizData(quizData, difficulty) {
    // Ensure required fields exist
    const requiredFields = ['title', 'questions'];
    for (const field of requiredFields) {
      if (!quizData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate questions
    if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('Quiz must have at least one question');
    }

    // Validate each question has required fields
    quizData.questions.forEach((question, index) => {
      if (!question.question) {
        throw new Error(`Question ${index + 1} is missing question text`);
      }
      if (question.type === 'multiple-choice' && (!question.options || question.options.length < 2)) {
        throw new Error(`Question ${index + 1} must have at least 2 options for multiple-choice type`);
      }
    });

    // Calculate total points
    const totalPoints = quizData.questions.reduce((total, q) => total + (q.points || 1), 0);

    // Set defaults and ensure consistency
    return {
      ...quizData,
      aiGenerated: true,
      difficulty: difficulty,
      totalPoints: totalPoints,
      passingScore: quizData.passingScore || (difficulty === 'easy' ? 60 : difficulty === 'medium' ? 70 : 80),
      timeLimit: quizData.timeLimit || (difficulty === 'easy' ? 15 : difficulty === 'medium' ? 25 : 35),
      attempts: quizData.attempts || { allowed: 3, current: 0 },
      settings: {
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswers: true,
        showScore: true,
        allowReview: true,
        ...quizData.settings
      },
      questions: quizData.questions.map((question, index) => ({
        ...question,
        difficulty: question.difficulty || difficulty,
        points: question.points || 1
      }))
    };
  }
  
  async testConnection() {
    try {
      const result = await this.model.generateContent('Hello, please respond with "Connection successful"');
      const response = await result.response;
      const text = response.text();
      logger.info('Gemini API connection test successful');
      return { success: true, message: text };
    } catch (error) {
      logger.error('Gemini API connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GeminiService();