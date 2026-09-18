import client from './client';

export const createApiKey = (data) => client.post('/apikeys', data);
export const listApiKeys = (workspace_id) => client.get('/apikeys', { params: { workspace_id } });
export const revokeApiKey = (id) => client.delete(`/apikeys/${id}`);
