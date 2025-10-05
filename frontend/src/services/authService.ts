import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: Array<{ msg: string; param: string }>;
}

export const authService = {
  // Register a new user
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'learner' }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.me, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      
      if (data.success) {
        return { success: true, user: data.data.user };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        message: 'Failed to fetch user data',
      };
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await fetch(API_ENDPOINTS.auth.logout, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
