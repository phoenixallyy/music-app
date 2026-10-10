import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  api,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredUser,
  setStoredUser
} from '../services/api';
import { firebaseService } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isOwner: boolean;
  isDemo: boolean;
  firebaseConfigured: boolean;
  missingFirebaseVars: string[];
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; displayName: string; inviteToken?: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; avatarUrl?: string }) => Promise<void>;
  clearError: () => void;
  loginQuickOwner: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state: restore from cached user immediately to avoid layout flicker
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const firebaseConfigured = firebaseService.isConfigured();
  const missingFirebaseVars = firebaseService.getMissingConfig();

  // Validate or restore session on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      const token = getStoredToken();
      const cached = getStoredUser();

      if (!token && !cached) {
        if (isMounted) setIsLoading(false);
        return;
      }

      // If Firebase is configured, synchronize with Firebase auth state
      if (firebaseConfigured) {
        const unsubscribe = firebaseService.subscribeAuth(async (fbUser) => {
          if (!isMounted) return;
          if (fbUser) {
            try {
              const res = await api.getMe();
              setUser(res.user);
              setStoredUser(res.user);
            } catch {
              // Fallback to basic profile
              const fallbackUser: User = {
                id: fbUser.uid,
                email: fbUser.email || 'user@vibevault.io',
                displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Listener',
                role: fbUser.email === 'owner@vibevault.io' ? 'owner' : 'friend',
                createdAt: new Date().toISOString()
              };
              setUser(fallbackUser);
              setStoredUser(fallbackUser);
            }
          }
          setIsLoading(false);
        });

        return () => {
          if (unsubscribe) unsubscribe();
        };
      }

      // Standard API Token validation
      try {
        const data = await api.getMe();
        if (isMounted) {
          setUser(data.user);
          setStoredUser(data.user);
        }
      } catch (err) {
        console.warn('[VibeVault Auth] Session validation notice:', err);
        // Only clear if 401 or token is corrupted, preserve cache if temporary network glitch
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('expired') || err.message.includes('invalid'))) {
          clearStoredToken();
          if (isMounted) setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [firebaseConfigured]);

  const login = async (email: string, password: string): Promise<User> => {
    setError(null);
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      const err = new Error('Please enter your email address.');
      setError(err.message);
      throw err;
    }
    if (!cleanPassword) {
      const err = new Error('Please enter your password.');
      setError(err.message);
      throw err;
    }

    try {
      // 1. If Firebase Auth is configured, sign in via Firebase Auth SDK
      if (firebaseConfigured) {
        try {
          await firebaseService.signIn(cleanEmail, cleanPassword);
        } catch (fbErr) {
          const formatted = firebaseService.formatError(fbErr);
          setError(formatted);
          throw new Error(formatted);
        }
      }

      // 2. Obtain session token and profile from backend
      const data = await api.login({ email: cleanEmail, password: cleanPassword });
      setStoredToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (formData: {
    email: string;
    password: string;
    displayName: string;
    inviteToken?: string;
  }): Promise<User> => {
    setError(null);
    const cleanEmail = formData.email.trim();
    const cleanPassword = formData.password.trim();
    const cleanName = formData.displayName.trim();

    if (!cleanEmail) throw new Error('Email address is required.');
    if (!cleanPassword) throw new Error('Password is required.');
    if (cleanPassword.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!cleanName) throw new Error('Display name is required.');

    try {
      if (firebaseConfigured) {
        try {
          await firebaseService.register(cleanEmail, cleanPassword);
        } catch (fbErr) {
          const formatted = firebaseService.formatError(fbErr);
          setError(formatted);
          throw new Error(formatted);
        }
      }

      const data = await api.register({
        email: cleanEmail,
        password: cleanPassword,
        displayName: cleanName,
        inviteToken: formData.inviteToken?.trim() || undefined,
      });

      setStoredToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (firebaseConfigured) {
        await firebaseService.signOut();
      }
    } catch (err) {
      console.warn('[VibeVault Auth] Firebase sign out notice:', err);
    } finally {
      clearStoredToken();
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (data: { displayName?: string; avatarUrl?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    setStoredUser(res.user);
  };

  const loginQuickOwner = async (): Promise<User> => {
    setError(null);
    try {
      const data = await api.loginDemoOwner();
      setStoredToken(data.token);
      // Mark as demo-authorized owner account
      const demoUser: User = {
        ...data.user,
        isDemo: true,
      };
      setStoredUser(demoUser);
      setUser(demoUser);
      return demoUser;
    } catch (err: unknown) {
      console.warn('[VibeVault] Demo owner endpoint notice, trying standard owner login:', err);
      return await login('owner@vibevault.io', 'owner1234');
    }
  };

  // Owner privilege check (supports owner role and demo owner preview)
  const isOwner = user?.role === 'owner' || user?.isDemo === true;
  const isDemo = Boolean(user?.isDemo);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isOwner,
        isDemo,
        firebaseConfigured,
        missingFirebaseVars,
        login,
        register,
        logout,
        updateProfile,
        clearError: () => setError(null),
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
