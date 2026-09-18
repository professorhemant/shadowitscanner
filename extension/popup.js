'use strict';

const $ = id => document.getElementById(id);

function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// Load stored config
chrome.storage.local.get(['api_token', 'workspace_id', 'api_url'], (data) => {
  if (data.api_token) $('api-token').value = data.api_token;
  if (data.workspace_id) $('workspace-id').value = data.workspace_id;
  if (data.api_url) $('api-url').value = data.api_url;
});

// Poll status from background
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (resp) => {
  if (!resp) return;
  $('stat-pending').textContent = resp.pending;
  $('stat-total').textContent = resp.total_reported;
  $('last-flush-text').textContent = resp.last_flush ? `Last sent: ${timeAgo(resp.last_flush)}` : 'Never sent';

  if (resp.configured) {
    $('status-badge').textContent = 'Active';
    $('status-badge').className = 'badge badge-green';
    $('status-text').textContent = 'Monitoring SaaS apps';
  } else {
    $('status-badge').textContent = 'Not configured';
    $('status-badge').className = 'badge badge-yellow';
    $('status-text').textContent = 'Set up below →';
  }
});

// Save config
$('save-btn').addEventListener('click', () => {
  const token = $('api-token').value.trim();
  const wsId = $('workspace-id').value.trim();
  const url = $('api-url').value.trim();

  if (!token || !wsId) {
    $('save-status').textContent = 'API token and workspace ID are required.';
    $('save-status').className = 'error-msg';
    return;
  }

  const toSave = { api_token: token, workspace_id: wsId };
  if (url) toSave.api_url = url;

  chrome.storage.local.set(toSave, () => {
    $('save-status').textContent = 'Saved! Extension is now active.';
    $('save-status').className = 'success-msg';
    $('status-badge').textContent = 'Active';
    $('status-badge').className = 'badge badge-green';
    $('status-text').textContent = 'Monitoring SaaS apps';
    setTimeout(() => { $('save-status').textContent = ''; }, 3000);
  });
});

// Flush now
$('flush-btn').addEventListener('click', () => {
  $('flush-btn').textContent = 'Sending…';
  $('flush-btn').disabled = true;
  chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, (resp) => {
    $('flush-btn').textContent = resp?.ok ? 'Sent ✓' : 'Failed';
    $('flush-btn').disabled = false;
    setTimeout(() => { $('flush-btn').textContent = 'Send now'; }, 2000);
    // Refresh pending count
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (s) => {
      if (s) {
        $('stat-pending').textContent = s.pending;
        $('stat-total').textContent = s.total_reported;
        $('last-flush-text').textContent = s.last_flush ? `Last sent: ${timeAgo(s.last_flush)}` : 'Never sent';
      }
    });
  });
});
