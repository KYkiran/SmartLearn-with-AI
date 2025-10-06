import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export interface Lesson {
  _id: string;
  title: string;
  content: string;
  duration: number;
  type: 'text' | 'video' | 'interactive';
  order: number;
  resources?: Array<{
    title: string;
    url: string;
    type: 'link' | 'document' | 'video' | 'image';
  }>;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  thumbnail?: string;
  lessons: Lesson[];
  totalDuration: number;
  difficulty: number;
  prerequisites: string[];
  learningObjectives: string[];
  creator: {
    _id: string;
    name: string;
    avatar?: string;
  };
  isPublished: boolean;
  publishedAt?: string;
  enrollmentCount: number;
  rating: {
    average: number;
    count: number;
  };
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseResponse {
  success: boolean;
  message?: string;
  data?: {
    courses?: Course[];
    course?: Course;
    pagination?: {
      current: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  errors?: Array<{ msg: string; param: string }>;
}

export const courseService = {
  // Get all courses
  async getCourses(params: {
    page?: number;
    limit?: number;
    subject?: string;
    level?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<CourseResponse> {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();

      const url = queryString ? `${API_ENDPOINTS.courses.list}?${queryString}` : API_ENDPOINTS.courses.list;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get courses error:', error);
      return {
        success: false,
        message: 'Failed to fetch courses',
      };
    }
  },

  // Get course by ID
  async getCourse(courseId: string): Promise<CourseResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.detail(courseId), {
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

  // Create new course
  async createCourse(courseData: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.create, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(courseData),
      });

      return await response.json();
    } catch (error) {
      console.error('Create course error:', error);
      return {
        success: false,
        message: 'Failed to create course',
      };
    }
  },

  // Generate course with AI
  async generateCourse(generationData: {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    learningObjectives?: string[];
    language?: string;
  }): Promise<CourseResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.generate, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(generationData),
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

  // Update course
  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<CourseResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.update(courseId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(courseData),
      });

      return await response.json();
    } catch (error) {
      console.error('Update course error:', error);
      return {
        success: false,
        message: 'Failed to update course',
      };
    }
  },

  // Delete course
  async deleteCourse(courseId: string): Promise<CourseResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.delete(courseId), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Delete course error:', error);
      return {
        success: false,
        message: 'Failed to delete course',
      };
    }
  },

  // Get user's enrolled/accessed courses
  async getEnrolledCourses(): Promise<CourseResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.enrolled, {
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

  // Add lesson to course
  async addLesson(courseId: string, lessonData: Partial<Lesson>): Promise<CourseResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.courses.addLesson(courseId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(lessonData),
      });

      return await response.json();
    } catch (error) {
      console.error('Add lesson error:', error);
      return {
        success: false,
        message: 'Failed to add lesson',
      };
    }
  },
};
