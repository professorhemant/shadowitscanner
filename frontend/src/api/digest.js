import client from './client';

export const getDigestSettings  = (workspace_id) => client.get('/digest', { params: { workspace_id } });
export const updateDigestSettings = (data) => client.put('/digest', data);
export const sendTestDigest     = (workspace_id) => client.post('/digest/test', { workspace_id });
export const getDigestPreview   = (workspace_id) => client.get('/digest/preview', { params: { workspace_id } });
