import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Course, CourseProgress } from './courseService';

export interface UserProgress {
  _id: string;
  user: string;
  courses: Array<{
    course: Course;
    status: string;
    progressPercentage: number;
    enrolledAt: string;
    lastAccessedAt: string;
    totalTimeSpent: number;
    lessonsProgress: Array<{
      lesson: string;
      status: string;
      timeSpent: number;
      completedAt?: string;
    }>;
  }>;
  overallStats: {
    totalCoursesEnrolled: number;
    totalCoursesCompleted: number;
    totalTimeSpent: number;
    totalQuizzesTaken: number;
    averageQuizScore: number;
    streakDays: number;
    lastStudyDate: string | null;
  };
  achievements: Array<{
    type: string;
    unlockedAt: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ msg: string; param: string }>;
}

export const userService = {
  // Get user progress
  async getUserProgress(): Promise<ApiResponse<UserProgress>> {
    try {
      const response = await fetch(API_ENDPOINTS.users.progress, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get user progress error:', error);
      return {
        success: false,
        message: 'Failed to fetch user progress',
      };
    }
  },

  // Get user stats
  async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.users.progress}/stats`, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        success: false,
        message: 'Failed to fetch user stats',
      };
    }
  },

  // Get user achievements
  async getUserAchievements(): Promise<ApiResponse<{ achievements: any[] }>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.users.progress}/achievements`, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get user achievements error:', error);
      return {
        success: false,
        message: 'Failed to fetch achievements',
      };
    }
  },

  // Update profile
  async updateProfile(data: {
    name?: string;
    bio?: string;
    avatar?: string;
    preferences?: any;
  }): Promise<ApiResponse<{ user: any }>> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.updateProfile, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
      };
    }
  },

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.changePassword, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password',
      };
    }
  },
};
