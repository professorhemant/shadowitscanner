import api from './client';

export function getBreaches(workspaceId) {
  return api.get('/breaches', { params: { workspace_id: workspaceId } });
}
