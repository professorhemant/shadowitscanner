import client from './client';

export const listAuditLogs = (params) => client.get('/audit', { params });
export const exportAuditCsv = (workspace_id) =>
  client.get('/audit/export', { params: { workspace_id }, responseType: 'blob' });
export const getAuditActionTypes = (workspace_id) =>
  client.get('/audit/action-types', { params: { workspace_id } });
