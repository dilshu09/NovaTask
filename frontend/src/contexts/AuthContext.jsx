import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

import { useTheme } from './ThemeContext';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { setTheme, setHighContrast, setReducedMotion } = useTheme();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync loaded settings to the ThemeContext hooks
  useEffect(() => {
    if (settings) {
      if (settings.theme) setTheme(settings.theme);
      if (settings.highContrast !== undefined) setHighContrast(settings.highContrast);
      if (settings.reducedMotion !== undefined) setReducedMotion(settings.reducedMotion);
    }
  }, [settings, setTheme, setHighContrast, setReducedMotion]);

  // Check if user session is active on startup
  useEffect(() => {
    const checkSession = async () => {
      // Check query params for Google OAuth redirect token first
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('accessToken', urlToken);
        // Clean URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          setSettings(res.data.settings);
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth expiration events from Axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setSettings(null);
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth_session_expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: loggedUser } = res.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(loggedUser);
      
      // Fetch settings
      const userRes = await api.get('/auth/me');
      setSettings(userRes.data.settings);
      
      toast.success('Welcome back to NovaTask!');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const loginOAuthMock = async (provider, email, name) => {
    try {
      const res = await api.post('/auth/oauth-mock', {
        provider,
        email,
        name,
        id: `mock_${provider}_${Date.now()}`
      });
      const { accessToken, user: loggedUser } = res.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(loggedUser);

      // Fetch settings
      const userRes = await api.get('/auth/me');
      setSettings(userRes.data.settings);

      toast.success(`Logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
      return { success: true };
    } catch (error) {
      toast.error('Social auth simulation failed.');
      return { success: false };
    }
  };

  const register = async (name, email) => {
    try {
      const res = await api.post('/auth/register', { name, email });
      toast.success(res.data.message);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { accessToken, user: registeredUser } = res.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(registeredUser);

      // Fetch user profile settings
      const userRes = await api.get('/auth/me');
      setSettings(userRes.data.settings);

      toast.success(res.data.message);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'OTP verification failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };


  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error on backend:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setSettings(null);
      toast.success('Logged out successfully.');
    }
  };

  const updateProfile = async (name, avatar) => {
    try {
      const res = await api.put('/users/profile', { name, avatar });
      setUser(res.data.data);
      toast.success('Profile updated');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Profile update failed');
      return { success: false };
    }
  };

  const updateSettings = async (settingsPayload) => {
    try {
      const res = await api.put('/users/settings', settingsPayload);
      setSettings(res.data.data);
      toast.success('Settings saved');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Settings update failed');
      return { success: false };
    }
  };

  const inviteMember = async (email, name, role) => {
    try {
      const res = await api.put('/users/settings/members', { email, name, role });
      // Only merge the members array — do NOT replace the full settings object
      // to prevent the theme sync effect from overwriting the current local theme
      setSettings(prev => ({
        ...prev,
        members: res.data.data?.members || prev?.members || [],
      }));
      toast.success('Collaborator invited successfully');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invitation failed');
      return { success: false };
    }
  };

  const sendLoginOtp = async (email) => {
    try {
      const res = await api.post('/auth/login/send-otp', { email });
      toast.success(res.data.message);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send OTP';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const verifyLoginOtp = async (email, otp) => {
    try {
      const res = await api.post('/auth/login/verify-otp', { email, otp });
      const { accessToken, user: loggedUser } = res.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(loggedUser);
      
      const userRes = await api.get('/auth/me');
      setSettings(userRes.data.settings);
      
      toast.success('Welcome back to NovaTask!');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Invalid OTP code';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        loading,
        isAuthenticated: !!user,
        login,
        loginOAuthMock,
        register,
        verifyOtp,
        logout,
        updateProfile,
        updateSettings,
        inviteMember,
        sendLoginOtp,
        verifyLoginOtp,
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
