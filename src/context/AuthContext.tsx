import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string; inviteToken?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { displayName?: string; avatarUrl?: string }) => Promise<void>;
  clearError: () => void;
  isOwner: boolean;
  loginQuickOwner: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        clearStoredToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await api.login({ email, password });
      setStoredToken(data.token);
      setUser(data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    }
  };

  const register = async (formData: { email: string; password: string; displayName: string; inviteToken?: string }) => {
    setError(null);
    try {
      const data = await api.register(formData);
      setStoredToken(data.token);
      setUser(data.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    }
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  const loginQuickOwner = async () => {
    await login('owner@vibevault.io', 'owner1234');
  };

  const isOwner = user?.role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError: () => setError(null),
        isOwner,
        loginQuickOwner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
