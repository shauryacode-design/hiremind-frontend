import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Development-only frontend preview mode.
// Set VITE_DEV_BYPASS_AUTH=true in .env to preview protected pages
// without connecting to the backend.
const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

const DEV_USER: User = {
  id: 999,
  first_name: 'Shaurya',
  last_name: 'Ojha',
  email: 'preview@hiremind.local',
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Development-only UI preview
    if (DEV_BYPASS_AUTH) {
      setUser(DEV_USER);
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('access_token');
        setUser(null);
      }
    }

    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    // Do not make real API calls in development preview mode.
    if (DEV_BYPASS_AUTH) {
      setUser(DEV_USER);
      return;
    }

    const response = await authApi.login({
      email,
      password,
    });

    localStorage.setItem('access_token', response.access_token);

    const userData = await authApi.getCurrentUser();
    setUser(userData);
  };

  const signup = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    // Do not make real API calls in development preview mode.
    if (DEV_BYPASS_AUTH) {
      setUser({
        ...DEV_USER,
        first_name: firstName,
        last_name: lastName,
        email,
      });
      return;
    }

    await authApi.signup({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });

    // Auto-login after signup
    await login(email, password);
  };

  const logout = () => {
    if (!DEV_BYPASS_AUTH) {
      localStorage.removeItem('access_token');
      setUser(null);
      return;
    }

    // In preview mode, keep the mock user so protected pages
    // remain available while reviewing the UI.
    setUser(DEV_USER);
  };

  const refreshUser = async () => {
    if (DEV_BYPASS_AUTH) {
      setUser(DEV_USER);
      return;
    }

    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('access_token');
        setUser(null);
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};