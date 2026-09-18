'use strict';

importScripts('saas_domains.js');

const BATCH_ALARM = 'shadow_it_flush';
const BATCH_INTERVAL_MIN = 5;
const MAX_QUEUE = 200;

// In-memory queue for current session; persisted to storage on change
let queue = [];
let flushing = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(BATCH_ALARM, { periodInMinutes: BATCH_INTERVAL_MIN });
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  if (!details.url.startsWith('https://')) return;

  let hostname;
  try {
    hostname = new URL(details.url).hostname;
  } catch {
    return;
  }

  const match = matchDomain(hostname);
  if (!match) return;

  // Avoid duplicating within same session queue
  const exists = queue.some(q => q.app_id === match.app_id);
  if (exists) {
    // Update last_seen
    queue = queue.map(q => q.app_id === match.app_id ? { ...q, last_seen_at: new Date().toISOString(), visit_count: (q.visit_count || 1) + 1 } : q);
  } else {
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push({
      app_id: match.app_id,
      app_name: match.app_name,
      category: match.category,
      developer: match.developer,
      hostname,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      visit_count: 1,
    });
  }

  // Persist queue to storage
  chrome.storage.local.set({ pending_queue: queue });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BATCH_ALARM) flushQueue();
});

// Also flush when popup opens (triggered by message)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATUS') {
    chrome.storage.local.get(['api_url', 'api_token', 'workspace_id', 'pending_queue', 'last_flush', 'total_reported'], (data) => {
      queue = data.pending_queue || [];
      sendResponse({
        configured: !!(data.api_token && data.workspace_id),
        pending: queue.length,
        last_flush: data.last_flush || null,
        total_reported: data.total_reported || 0,
      });
    });
    return true; // async
  }
  if (msg.type === 'FLUSH_NOW') {
    flushQueue().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
});

async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const data = await new Promise(resolve => chrome.storage.local.get(['api_url', 'api_token', 'workspace_id', 'pending_queue', 'total_reported'], resolve));
    const apiUrl = data.api_url || 'https://backend-production-59b25.up.railway.app';
    const token = data.api_token;
    const workspaceId = data.workspace_id;
    queue = data.pending_queue || [];

    if (!token || !workspaceId || queue.length === 0) return;

    const payload = { workspace_id: workspaceId, apps: queue };
    const res = await fetch(`${apiUrl}/api/extension/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const reported = (data.total_reported || 0) + queue.length;
      queue = [];
      chrome.storage.local.set({ pending_queue: [], last_flush: new Date().toISOString(), total_reported: reported });
    }
  } catch {
    // Network error — retry on next alarm
  } finally {
    flushing = false;
  }
}
