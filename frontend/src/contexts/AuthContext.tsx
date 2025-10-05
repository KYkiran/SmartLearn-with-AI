import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, User } from '../services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and fetch user data
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        const result = await authService.getCurrentUser();
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    
    if (response.success && response.data) {
      setUser(response.data.user);
      toast.success('Logged in successfully!');
    } else {
      const errorMessage = response.errors?.[0]?.msg || response.message || 'Login failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await authService.register(name, email, password);
    
    if (response.success && response.data) {
      setUser(response.data.user);
      toast.success('Account created successfully!');
    } else {
      const errorMessage = response.errors?.[0]?.msg || response.message || 'Signup failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
