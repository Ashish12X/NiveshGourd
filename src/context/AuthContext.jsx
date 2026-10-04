import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../lib/api';
import { switchLanguage } from '../i18n/i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session on app startup
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const activeLang = localStorage.getItem('ng_lang') || 'en';
      const res = await api.get(`/auth/me?lang=${activeLang}`);
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.user.preferences?.language) {
          switchLanguage(res.data.user.preferences.language);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 is normal when user is not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const activeLang = localStorage.getItem('ng_lang') || 'en';
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.user.preferences?.language) {
          switchLanguage(res.data.user.preferences.language);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (error) {
      const message = getErrorMessage(error, 'Invalid credentials');
      setAuthError(message);
      throw new Error(message);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        if (res.data.user.preferences?.language) {
          switchLanguage(res.data.user.preferences.language);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed');
      setAuthError(message);
      throw new Error(message);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout warning:', err.message);
    } finally {
      setUser(null);
    }
  };

  // Profile update handler
  const updateProfile = async (profileData) => {
    try {
      const activeLang = profileData?.preferences?.language || localStorage.getItem('ng_lang') || 'en';
      const res = await api.put(`/users/profile?lang=${activeLang}`, profileData);
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.data?.message || 'Failed to update profile');
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update profile');
      throw new Error(message);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    authError,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
