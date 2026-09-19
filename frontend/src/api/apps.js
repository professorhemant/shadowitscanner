import client from './client';

export const listApps = (params) => client.get('/apps', { params });
export const getAppDetail = (id) => client.get(`/apps/${id}`);
export const whitelistApp = (id, reason) => client.post(`/apps/${id}/whitelist`, { reason });
export const removeWhitelist = (id) => client.delete(`/apps/${id}/whitelist`);
export const exportAppsCsv = (workspaceId) =>
  client.get('/apps/export', { params: { workspace_id: workspaceId }, responseType: 'blob' });
