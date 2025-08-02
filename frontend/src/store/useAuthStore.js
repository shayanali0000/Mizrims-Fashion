import { create } from 'zustand';
import { authAPI } from '../lib/api';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: localStorage.getItem('jwt_token'),
  isAuthenticated: !!localStorage.getItem('jwt_token'),
  isLoading: false,
  error: null,

  // Actions
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.login(username, password);
      const { access_token } = response;
      
      // Store token
      localStorage.setItem('jwt_token', access_token);
      
      set({
        token: access_token,
        user: { username },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({
        isLoading: false,
        error: errorMessage,
        user: null,
        token: null,
        isAuthenticated: false,
      });
      
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  // Initialize auth state from localStorage
  initializeAuth: () => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      set({
        token,
        isAuthenticated: true,
        user: { username: 'admin' }, // We could decode JWT to get username
      });
    }
  },
}));

export default useAuthStore;