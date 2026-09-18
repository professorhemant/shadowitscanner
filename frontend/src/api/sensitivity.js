import api from './client';

export function getSensitivity(workspaceId) {
  return api.get('/sensitivity', { params: { workspace_id: workspaceId } });
}
