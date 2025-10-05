import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export interface Lesson {
  _id: string;
  title: string;
  content: string;
  duration: number;
  order: number;
  resources?: Array<{ title: string; url: string; type: string }>;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  lessons: Lesson[];
  creator: {
    _id: string;
    name: string;
    avatar?: string;
  };
  thumbnail?: string;
  totalDuration?: number;
  isPublished: boolean;
  aiGenerated?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  status: string;
  progressPercentage: number;
  enrolledAt: string;
  lastAccessedAt: string;
  totalTimeSpent: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ msg: string; param: string }>;
}

export const courseService = {
  // Get all courses
  async getCourses(params?: {
    page?: number;
    limit?: number;
    subject?: string;
    level?: string;
    search?: string;
  }): Promise<ApiResponse<{ courses: Course[]; pagination: any }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.subject) queryParams.append('subject', params.subject);
      if (params?.level) queryParams.append('level', params.level);
      if (params?.search) queryParams.append('search', params.search);

      const response = await fetch(
        `${API_ENDPOINTS.courses.list}?${queryParams.toString()}`,
        {
          headers: getAuthHeaders(),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Get courses error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Get single course
  async getCourse(id: string): Promise<ApiResponse<{ course: Course; userProgress?: CourseProgress }>> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.detail(id), {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get course error:', error);
      return {
        success: false,
        message: 'Failed to fetch course',
      };
    }
  },

  // Generate course with AI
  async generateCourse(data: {
    topic: string;
    level: string;
    duration: number;
    learningObjectives?: string[];
    language?: string;
  }): Promise<ApiResponse<{ course: Course }>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.courses.list}/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Generate course error:', error);
      return {
        success: false,
        message: 'Failed to generate course',
      };
    }
  },

  // Get enrolled courses
  async getEnrolledCourses(): Promise<ApiResponse<{ courses: Array<{ course: Course; progress: CourseProgress }> }>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.courses.list}/enrolled`, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get enrolled courses error:', error);
      return {
        success: false,
        message: 'Failed to fetch enrolled courses',
      };
    }
  },

  // Update course progress
  async updateCourseProgress(
    courseId: string,
    data: { status?: string; progressPercentage?: number }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.users.progress}/courses/${courseId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Update course progress error:', error);
      return {
        success: false,
        message: 'Failed to update progress',
      };
    }
  },

  // Update lesson progress
  async updateLessonProgress(
    courseId: string,
    data: { lessonId: string; status: string; timeSpent?: number }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.users.progress}/courses/${courseId}/lessons`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Update lesson progress error:', error);
      return {
        success: false,
        message: 'Failed to update lesson progress',
      };
    }
  },
};
