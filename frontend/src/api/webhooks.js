import api from './client';

export function listWebhooks(workspaceId) {
  return api.get('/webhooks', { params: { workspace_id: workspaceId } });
}
export function createWebhook(data) {
  return api.post('/webhooks', data);
}
export function updateWebhook(id, data) {
  return api.patch(`/webhooks/${id}`, data);
}
export function deleteWebhook(id) {
  return api.delete(`/webhooks/${id}`);
}
export function testWebhook(id) {
  return api.post(`/webhooks/${id}/test`);
}
export function getDeliveries(id) {
  return api.get(`/webhooks/${id}/deliveries`);
}
