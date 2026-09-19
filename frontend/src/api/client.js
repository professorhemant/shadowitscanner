import axios from 'axios';

const client = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('shadow_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

client.interceptors.response.use(
  r => r,
  err => {
    const data = err.response?.data;
    if (data?.demo_readonly) {
      import('../store/toastStore').then(({ useToastStore }) => {
        useToastStore.getState().addToast('Read-only demo — sign up free to make changes.', 'demo');
      });
      return Promise.reject(err);
    }
    const onAuthPage = ['/login', '/register'].some(p => window.location.pathname.startsWith(p));
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('shadow_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
