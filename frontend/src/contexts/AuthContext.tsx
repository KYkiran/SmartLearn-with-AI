import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  email: string;
  name: string;
  joinedDate: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, name?: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, name?: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const storedUsers = JSON.parse(localStorage.getItem("users") || "{}");
    const userExists = storedUsers[email];

    if (!userExists) {
      throw new Error("User not found. Please sign up first.");
    }

    if (userExists.password !== password) {
      throw new Error("Invalid password");
    }

    const userData: User = {
      email,
      name: userExists.name || name || email.split("@")[0],
      joinedDate: userExists.joinedDate,
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const signup = async (email: string, password: string, name: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const storedUsers = JSON.parse(localStorage.getItem("users") || "{}");
    
    if (storedUsers[email]) {
      throw new Error("User already exists. Please login.");
    }

    const userData: User = {
      email,
      name,
      joinedDate: new Date().toISOString(),
    };

    storedUsers[email] = {
      password,
      name,
      joinedDate: userData.joinedDate,
    };

    localStorage.setItem("users", JSON.stringify(storedUsers));
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
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
