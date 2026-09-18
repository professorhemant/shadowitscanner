import api from './client';

export function getAnalytics(workspaceId, days = 90) {
  return api.get('/analytics', { params: { workspace_id: workspaceId, days } });
}
