import client from './client';

export const listWorkspaces = () => client.get('/workspaces');
export const createWorkspace = (data) => client.post('/workspaces', data);
export const updateWorkspace = (id, data) => client.put(`/workspaces/${id}`, data);
export const deleteWorkspace = (id) => client.delete(`/workspaces/${id}`);
