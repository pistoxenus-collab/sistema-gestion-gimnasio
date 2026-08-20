import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isProfessor: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, role?: string) => Promise<void>;
  quickLogin: (userId: number) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('f6_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error } = useToast();

  const isProfessor = user?.role === 'professor' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const refreshUser = async () => {
    try {
      if (token) {
        const userData = await authApi.getMe();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authApi.login(email, password);
      localStorage.setItem('f6_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      success(`¡Bienvenido de nuevo, ${data.user.name}!`);
    } catch (err: any) {
      error(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, role = 'student') => {
    try {
      setIsLoading(true);
      const data = await authApi.register(name, email, password, phone, role);
      localStorage.setItem('f6_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      success(`¡Cuenta creada con éxito! Bienvenido ${data.user.name}`);
    } catch (err: any) {
      error(err.message || 'Error al registrar usuario');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (userId: number) => {
    try {
      setIsLoading(true);
      const data = await authApi.quickLogin(userId);
      localStorage.setItem('f6_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      success(`Has cambiado a la cuenta de: ${data.user.name} (${data.user.role === 'professor' ? 'Profesor' : 'Alumno'})`);
    } catch (err: any) {
      error(err.message || 'Error al cambiar de cuenta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('f6_auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isProfessor,
        isStudent,
        login,
        register,
        quickLogin,
        logout,
        refreshUser,
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
