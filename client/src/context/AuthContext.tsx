import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.js';
import { api, setToken, removeToken, getToken } from '../api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'investor' | 'company') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginAsDemoUser: (demoUser: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const activeToken = getToken();
      if (!activeToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      removeToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, role: 'investor' | 'company') => {
    const res = await api.register({ name, email, password, role });
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  };

  const loginAsDemoUser = async (demoUser: any) => {
    // For demo users, standard password is "password123"
    await login(demoUser.email, 'password123');
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        loginAsDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

