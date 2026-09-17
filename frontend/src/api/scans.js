import client from './client';

export const triggerScan = (workspace_id, source) => client.post('/scans/trigger', { workspace_id, source });
export const getScanHistory = (workspace_id) => client.get('/scans/history', { params: { workspace_id } });
export const getScanStatus = (id) => client.get(`/scans/${id}`);
