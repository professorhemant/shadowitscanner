import api from './client';

export function getSlackBotConfig(workspaceId) {
  return api.get('/slack-bot/config', { params: { workspace_id: workspaceId } });
}

export function configureSlackBot(data) {
  return api.post('/slack-bot/configure', data);
}

export function testSlackWebhook(workspaceId) {
  return api.post('/slack-bot/test', { workspace_id: workspaceId });
}

export function sendDigestNow(workspaceId) {
  return api.post('/slack-bot/send-now', { workspace_id: workspaceId });
}
