import api from './index';

export function downloadReport(workspaceId) {
  return api.get('/reports/generate', {
    params: { workspace_id: workspaceId },
    responseType: 'blob',
  });
}
