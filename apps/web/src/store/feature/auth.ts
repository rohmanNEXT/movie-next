import { create } from 'zustand';
import type { User, ApiResponse } from './types';
import connectApi from '@/services/api';

// Re-export for components
export type { User };

// Helper to handle local persistence for auth
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('chill_user_session');
  return saved ? JSON.parse(saved) : null;
};

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const saveAuthToLocal = (user: User | null, token: string | null) => {
  if (typeof window !== 'undefined') {
    if (user && token) {
      localStorage.setItem('chill_user_session', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('chill_user_session');
      localStorage.removeItem('token');
    }
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  logout: () => void;
  clearAuthError: () => void;
  registerUser: (formData: any) => Promise<ApiResponse>;
  loginUser: (credentials: { email: string; password: string }) => Promise<ApiResponse<{ token: string; user: User }>>;
  forgotPassword: (email: string) => Promise<ApiResponse>;
  resetPassword: (token: string, password: string) => Promise<ApiResponse>;
  googleLogin: (idToken: string, isRegister?: boolean) => Promise<ApiResponse<{ token: string; user: User }>>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  loading: false,
  error: null,
  
  setUser: (user) => {
    set((state) => {
      saveAuthToLocal(user, state.token);
      return { user };
    });
  },
  
  logout: () => {
    saveAuthToLocal(null, null);
    set({ user: null, token: null, error: null });
  },
  
  clearAuthError: () => set({ error: null }),
  
  registerUser: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await connectApi.post<ApiResponse>('/register', formData);
      set({ loading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mendaftar';
      set({ error: msg, loading: false });
      throw err;
    }
  },
  
  loginUser: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await connectApi.post<ApiResponse<{ token: string; user: User }>>('/login', credentials);
      set({ user: data.data.user, token: data.data.token, loading: false });
      saveAuthToLocal(data.data.user, data.data.token);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal login';
      set({ error: msg, loading: false });
      throw err;
    }
  },
  
  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const { data } = await connectApi.post<ApiResponse>('/forgot-password', { email });
      set({ loading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengirim email reset';
      set({ error: msg, loading: false });
      throw err;
    }
  },
  
  resetPassword: async (token, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await connectApi.post<ApiResponse>('/reset-password', { token, password });
      set({ loading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mereset password';
      set({ error: msg, loading: false });
      throw err;
    }
  },
  
  googleLogin: async (idToken, isRegister = false) => {
    set({ loading: true, error: null });
    try {
      const { data } = await connectApi.post<ApiResponse<{ token: string; user: User }>>('/auth/google', { idToken, isRegister });
      set({ user: data.data.user, token: data.data.token, loading: false });
      saveAuthToLocal(data.data.user, data.data.token);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal login dengan Google';
      set({ error: msg, loading: false });
      throw err;
    }
  },
  
  fetchMe: async () => {
    try {
      const { data } = await connectApi.get<ApiResponse<User>>('/me');
      const current = useAuthStore.getState().user;
      // Bandingkan kalo data nya beda baru update biar gak re-render terus
      if (JSON.stringify(current) !== JSON.stringify(data.data)) {
        set({ user: data.data });
      }
    } catch {
      // silently fail
    }
  },
}));
