import api from './client';

export const listMembers    = (workspaceId)        => api.get(`/team/${workspaceId}`);
export const inviteMember   = (data)               => api.post('/team/invite', data);
export const revokeMember   = (id)                 => api.delete(`/team/${id}`);
export const listInvites    = ()                   => api.get('/team/invites');
export const acceptInvite   = (token)              => api.post('/team/accept', { token });
