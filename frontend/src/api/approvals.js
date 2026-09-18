import client from './client';

export const submitApproval = (data) => client.post('/approvals/submit', data);
export const listApprovals = (params) => client.get('/approvals', { params });
export const reviewApproval = (id, data) => client.put(`/approvals/${id}/review`, data);
export const getWorkspaceInfo = (workspaceId) => client.get(`/approvals/workspace/${workspaceId}`);
