import client from './client';

export const getDashboardStats = (workspace_id) =>
  client.get('/dashboard/stats', { params: workspace_id ? { workspace_id } : {} });
