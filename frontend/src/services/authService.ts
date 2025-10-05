import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'admin'; // Updated to match two-role system
  avatar?: string;
  bio?: string;
  preferences?: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    subjects: string[];
  };
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
    emailVerificationRequired?: boolean;
  };
  errors?: Array<{ msg: string; param: string; path: string }>;
}

export const authService = {
  // Register a new user
  async register(name: string, email: string, password: string, role: 'learner' = 'learner'): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
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
        localStorage.setItem('user', JSON.stringify(data.data.user));
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
        localStorage.setItem('user', JSON.stringify(data.data.user));
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

  // Update profile
  async updateProfile(profileData: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.updateProfile, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      
      if (data.success && data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.changePassword, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
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
      localStorage.removeItem('user');
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // Get stored user
  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
