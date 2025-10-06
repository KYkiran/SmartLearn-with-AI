import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export interface UserProgress {
  user: string;
  courses: Array<{
    course: {
      _id: string;
      title: string;
      subject: string;
      level: string;
      thumbnail?: string;
      totalDuration: number;
      creator: {
        name: string;
        avatar?: string;
      };
    };
    status: 'enrolled' | 'in-progress' | 'completed' | 'dropped';
    progressPercentage: number;
    enrolledAt: string;
    lastAccessedAt: string;
    totalTimeSpent: number;
  }>;
  overallStats: {
    totalCoursesEnrolled: number;
    totalCoursesCompleted: number;
    totalTimeSpent: number;
    totalQuizzesTaken: number;
    averageQuizScore: number;
    streakDays: number;
    lastStudyDate?: string;
  };
  achievements: Array<{
    type: string;
    earnedAt: string;
  }>;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data?: {
    progress?: UserProgress;
    stats?: any;
    achievements?: any[];
    leaderboard?: any[];
    recentCourses?: any[];
  };
  errors?: Array<{ msg: string; param: string }>;
}

export const userService = {
  // Get user progress
  async getProgress(): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.progress, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get progress error:', error);
      return {
        success: false,
        message: 'Failed to fetch progress',
      };
    }
  },

  // Update course progress
  async updateCourseProgress(courseId: string, progressData: {
    status?: string;
    progressPercentage?: number;
    timeSpent?: number;
  }): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.updateCourseProgress(courseId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(progressData),
      });

      return await response.json();
    } catch (error) {
      console.error('Update course progress error:', error);
      return {
        success: false,
        message: 'Failed to update course progress',
      };
    }
  },

  // Update lesson progress
  async updateLessonProgress(courseId: string, progressData: {
    lessonId: string;
    status: 'not-started' | 'in-progress' | 'completed';
    timeSpent?: number;
  }): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.updateLessonProgress(courseId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(progressData),
      });

      return await response.json();
    } catch (error) {
      console.error('Update lesson progress error:', error);
      return {
        success: false,
        message: 'Failed to update lesson progress',
      };
    }
  },

  // Get user stats
  async getStats(): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.stats, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        success: false,
        message: 'Failed to fetch stats',
      };
    }
  },

  // Get user achievements
  async getAchievements(): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.achievements, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get achievements error:', error);
      return {
        success: false,
        message: 'Failed to fetch achievements',
      };
    }
  },

  // Get user dashboard
  async getDashboard(): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.dashboard, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get dashboard error:', error);
      return {
        success: false,
        message: 'Failed to fetch dashboard',
      };
    }
  },

  // Get leaderboard
  async getLeaderboard(limit = 10): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.users.leaderboard}?limit=${limit}`, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return {
        success: false,
        message: 'Failed to fetch leaderboard',
      };
    }
  },

  // Add bookmark
  async addBookmark(bookmarkData: {
    lessonId: string;
    timestamp?: number;
    note?: string;
  }): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.bookmarks, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookmarkData),
      });

      return await response.json();
    } catch (error) {
      console.error('Add bookmark error:', error);
      return {
        success: false,
        message: 'Failed to add bookmark',
      };
    }
  },

  // Add note
  async addNote(noteData: {
    lessonId: string;
    content: string;
  }): Promise<UserResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.users.notes, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(noteData),
      });

      return await response.json();
    } catch (error) {
      console.error('Add note error:', error);
      return {
        success: false,
        message: 'Failed to add note',
      };
    }
  },
};
