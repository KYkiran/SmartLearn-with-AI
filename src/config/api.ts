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
  },
  // Course endpoints
  courses: {
    list: `${API_BASE_URL}/courses`,
    create: `${API_BASE_URL}/courses`,
    detail: (id: string) => `${API_BASE_URL}/courses/${id}`,
    update: (id: string) => `${API_BASE_URL}/courses/${id}`,
    delete: (id: string) => `${API_BASE_URL}/courses/${id}`,
  },
  // Quiz endpoints
  quizzes: {
    list: `${API_BASE_URL}/quizzes`,
    create: `${API_BASE_URL}/quizzes`,
    detail: (id: string) => `${API_BASE_URL}/quizzes/${id}`,
    submit: (id: string) => `${API_BASE_URL}/quizzes/${id}/submit`,
  },
  // User endpoints
  users: {
    progress: `${API_BASE_URL}/users/progress`,
    updateProgress: `${API_BASE_URL}/users/progress`,
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
