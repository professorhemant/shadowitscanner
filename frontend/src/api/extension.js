import api from './client';

export function getExtensionStats(workspaceId) {
  return api.get('/extension/stats', { params: { workspace_id: workspaceId } });
}
