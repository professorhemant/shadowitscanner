import api from './client';

export function getChecklist(workspaceId, email) {
  return api.get('/offboarding/checklist', {
    params: { workspace_id: workspaceId, email },
  });
}
