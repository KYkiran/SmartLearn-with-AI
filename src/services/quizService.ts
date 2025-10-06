import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

export interface QuizOption {
  _id: string;
  text: string;
  isCorrect?: boolean; // Only visible to creators or after completion
}

export interface QuizQuestion {
  _id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay';
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  tags?: string[];
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  course: {
    _id: string;
    title: string;
    subject: string;
    level: string;
  };
  // NEW (optional): for lesson-level quizzes
  lesson?: string | null;
  quizType?: 'lesson' | 'course' | 'practice';

  questions: QuizQuestion[];
  timeLimit?: number;
  attempts: {
    allowed: number;
    current: number;
  };
  passingScore: number;
  totalPoints: number;
  isPublished: boolean;
  publishedAt?: string;
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showCorrectAnswers: boolean;
    showScore: boolean;
    allowReview: boolean;
  };
  aiGenerated: boolean;
  creator: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  _id: string;
  quiz: string; // may be populated in some responses, keep string here for compatibility
  answers: Array<{
    questionId: string;
    answer: any;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  score: {
    points: number;
    percentage: number;
    passed: boolean;
  };
  timeSpent: number;
  startedAt: string;
  completedAt: string;
  status: 'started' | 'completed' | 'abandoned';
  createdAt?: string;
}

export interface QuizResponse {
  success: boolean;
  message?: string;
  data?: {
    quizzes?: Quiz[];
    quiz?: Quiz;
    attempt?: QuizAttempt;
    attempts?: QuizAttempt[];
    result?: any;
    userAttempts?: QuizAttempt[];
    remainingAttempts?: number;
    passed?: boolean;
    newAchievements?: any[];
    correctAnswers?: Array<{
      questionId: string;
      correctAnswer: string;
      explanation: string;
    }>;
    pagination?: {
      current: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    // For course results endpoint (aggregated)
    lessonQuizzes?: QuizAttempt[];
    courseQuiz?: QuizAttempt | null;
    summary?: {
      totalAttempts: number;
      passed: number;
      averageScore: number;
    };
  };
  errors?: Array<{ msg: string; param: string }>;
}

export const quizService = {
  // List all quizzes with filters (kept)
  async getQuizzes(params: {
    page?: number;
    limit?: number;
    course?: string;
    difficulty?: string;
    search?: string;
  } = {}): Promise<QuizResponse> {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();

      const url = queryString
        ? `${API_ENDPOINTS.quizzes.list}?${queryString}`
        : API_ENDPOINTS.quizzes.list;

      const response = await fetch(url, { headers: getAuthHeaders() });
      return await response.json();
    } catch (error) {
      console.error('Get quizzes error:', error);
      return { success: false, message: 'Failed to fetch quizzes' };
    }
  },

  // Get a single quiz (kept)
  async getQuiz(quizId: string): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.detail(quizId), {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Get quiz error:', error);
      return { success: false, message: 'Failed to fetch quiz' };
    }
  },

  // Create quiz (manual)
  async createQuiz(quizData: Partial<Quiz>): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.create, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(quizData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create quiz error:', error);
      return { success: false, message: 'Failed to create quiz' };
    }
  },

  // Generate quiz (legacy course-wide generator)
  async generateQuiz(generationData: {
    courseId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    numQuestions: number;
    questionTypes?: string[];
    topics?: string[];
  }): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.generate, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(generationData),
      });
      return await response.json();
    } catch (error) {
      console.error('Generate quiz error:', error);
      return { success: false, message: 'Failed to generate quiz' };
    }
  },

  // NEW: Generate lesson-specific quiz
  async generateLessonQuiz(data: {
    courseId: string;
    lessonId: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    numQuestions?: number;
  }): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.generateLesson, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Generate lesson quiz error:', error);
      return { success: false, message: 'Failed to generate lesson quiz' };
    }
  },

  // NEW: Generate final course quiz
  async generateCourseQuiz(data: {
    courseId: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    numQuestions?: number;
  }): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.generateCourse, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Generate course quiz error:', error);
      return { success: false, message: 'Failed to generate course quiz' };
    }
  },

  // NEW: Get all quizzes for a course (optionally filter by type)
  async getCourseQuizzes(courseId: string, type?: 'lesson' | 'course' | 'all'): Promise<QuizResponse> {
    try {
      const qs = type && type !== 'all' ? `?type=${type}` : '';
      const response = await fetch(`${API_ENDPOINTS.quizzes.courseQuizzes(courseId)}${qs}`, {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Get course quizzes error:', error);
      return { success: false, message: 'Failed to fetch course quizzes' };
    }
  },

  // Submit attempt (kept)
  async submitQuizAttempt(quizId: string, attemptData: {
    answers: any[];
    timeSpent?: number;
    startedAt?: string;
  }): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.attempt(quizId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(attemptData),
      });
      return await response.json();
    } catch (error) {
      console.error('Submit quiz attempt error:', error);
      return { success: false, message: 'Failed to submit quiz attempt' };
    }
  },

  // Attempts list (kept)
  async getQuizAttempts(quizId: string): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.attempts(quizId), {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Get quiz attempts error:', error);
      return { success: false, message: 'Failed to fetch quiz attempts' };
    }
  },

  // Get single-quiz results (kept)
  async getQuizResults(quizId: string): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.results(quizId), {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Get quiz results error:', error);
      return { success: false, message: 'Failed to fetch quiz results' };
    }
  },

  // NEW: Get aggregated results for a course (lesson + final)
  async getCourseResults(courseId: string): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.courseResults(courseId), {
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Get course results error:', error);
      return { success: false, message: 'Failed to fetch course results' };
    }
  },

  // Update quiz (kept)
  async updateQuiz(quizId: string, quizData: Partial<Quiz>): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.update(quizId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(quizData),
      });
      return await response.json();
    } catch (error) {
      console.error('Update quiz error:', error);
      return { success: false, message: 'Failed to update quiz' };
    }
  },

  // Delete quiz (kept)
  async deleteQuiz(quizId: string): Promise<QuizResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.quizzes.delete(quizId), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Delete quiz error:', error);
      return { success: false, message: 'Failed to delete quiz' };
    }
  },
};
