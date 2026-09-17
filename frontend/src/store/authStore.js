import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('shadow_token'),
  setAuth: (user, token) => {
    localStorage.setItem('shadow_token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('shadow_token');
    set({ user: null, token: null });
  },
}));
