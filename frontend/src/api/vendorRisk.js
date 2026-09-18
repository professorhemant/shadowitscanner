import api from './client';

export function getVendorRisk(workspaceId) {
  return api.get('/vendor-risk', { params: { workspace_id: workspaceId } });
}
