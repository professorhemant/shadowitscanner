import client from './client';

export const login = (email, password) => client.post('/auth/login', { email, password });
export const register = (name, email, password) => client.post('/auth/register', { name, email, password });
export const me = () => client.get('/auth/me');
export const changePassword = (current_password, new_password) =>
  client.put('/auth/change-password', { current_password, new_password });
export const demoLogin = () => client.post('/demo/login');
