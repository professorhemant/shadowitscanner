import client from './client';

export const listApps = (params) => client.get('/apps', { params });
export const whitelistApp = (id, reason) => client.post(`/apps/${id}/whitelist`, { reason });
export const removeWhitelist = (id) => client.delete(`/apps/${id}/whitelist`);
