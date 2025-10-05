// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    me: `${API_BASE_URL}/auth/me`,
    logout: `${API_BASE_URL}/auth/logout`,
    updateProfile: `${API_BASE_URL}/auth/profile`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
    verifyEmail: (token: string) => `${API_BASE_URL}/auth/verify-email/${token}`,
  },
  
  // Course endpoints
  courses: {
    list: `${API_BASE_URL}/courses`,
    create: `${API_BASE_URL}/courses`,
    generate: `${API_BASE_URL}/courses/generate`, // NEW: AI generation
    detail: (id: string) => `${API_BASE_URL}/courses/${id}`,
    update: (id: string) => `${API_BASE_URL}/courses/${id}`,
    delete: (id: string) => `${API_BASE_URL}/courses/${id}`,
    enrolled: `${API_BASE_URL}/courses/user/enrolled`, // NEW: User's courses
    addLesson: (id: string) => `${API_BASE_URL}/courses/${id}/lessons`, // NEW: Add lessons
  },
  
  // Quiz endpoints
  quizzes: {
    list: `${API_BASE_URL}/quizzes`,
    create: `${API_BASE_URL}/quizzes`,
    generate: `${API_BASE_URL}/quizzes/generate`, // NEW: AI generation
    detail: (id: string) => `${API_BASE_URL}/quizzes/${id}`,
    update: (id: string) => `${API_BASE_URL}/quizzes/${id}`,
    delete: (id: string) => `${API_BASE_URL}/quizzes/${id}`,
    attempt: (id: string) => `${API_BASE_URL}/quizzes/${id}/attempt`, // FIXED: was submit
    attempts: (id: string) => `${API_BASE_URL}/quizzes/${id}/attempts`, // NEW: Get attempts
    results: (id: string) => `${API_BASE_URL}/quizzes/${id}/results`, // NEW: Get results
  },
  
  // User endpoints
  users: {
    progress: `${API_BASE_URL}/users/progress`,
    updateCourseProgress: (courseId: string) => `${API_BASE_URL}/users/progress/${courseId}`,
    updateLessonProgress: (courseId: string) => `${API_BASE_URL}/users/progress/${courseId}/lesson`,
    stats: `${API_BASE_URL}/users/stats`, // NEW: User statistics
    achievements: `${API_BASE_URL}/users/achievements`, // NEW: Achievements
    dashboard: `${API_BASE_URL}/users/dashboard`, // NEW: Dashboard data
    leaderboard: `${API_BASE_URL}/users/leaderboard`, // NEW: Leaderboard
    bookmarks: `${API_BASE_URL}/users/bookmarks`, // NEW: Bookmarks
    notes: `${API_BASE_URL}/users/notes`, // NEW: Notes
  },
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
