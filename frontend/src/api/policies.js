import api from './client';

export const listPolicies   = (workspaceId)   => api.get('/policies', { params: { workspace_id: workspaceId } });
export const previewPolicies = (workspaceId)  => api.get('/policies/preview', { params: { workspace_id: workspaceId } });
export const createPolicy   = (data)          => api.post('/policies', data);
export const updatePolicy   = (id, data)      => api.patch(`/policies/${id}`, data);
export const deletePolicy   = (id)            => api.delete(`/policies/${id}`);
