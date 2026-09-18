import api from './client';

export function getSchedule(workspaceId) {
  return api.get('/schedule', { params: { workspace_id: workspaceId } });
}
export function updateSchedule(workspaceId, data) {
  return api.put(`/schedule/${workspaceId}`, data);
}
