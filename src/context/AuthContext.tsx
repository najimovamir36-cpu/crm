import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getToken, setToken, removeToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isParent: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginParent: (studentId: string, password: string) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          removeToken();
          setTokenState(null);
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
        removeToken();
        setTokenState(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    }
  };

  const loginParent = async (studentId: string, password: string) => {
    const res = await api.parentLogin({ studentId, password });
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { loginWithGoogleFirebase } = await import('../services/firebaseService');
      const fbUser = await loginWithGoogleFirebase();
      if (fbUser && fbUser.email) {
        const res = await api.loginWithGoogle({
          email: fbUser.email,
          displayName: fbUser.displayName,
          uid: fbUser.uid,
        });
        if (res.success && res.token && res.user) {
          setToken(res.token);
          setTokenState(res.token);
          setUser(res.user);
        }
      }
    } catch (e: any) {
      console.error('Login with Google error in context:', e);
      throw e;
    }
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isParent = user?.role === 'PARENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        isParent,
        login,
        loginParent,
        loginWithGoogle,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
