'use strict';

const axios = require('axios');
const { scoreApp } = require('../scoring/engine');

const BASE = 'https://slack.com/api';

async function slackGet(endpoint, token, params = {}) {
  const res = await axios.get(`${BASE}/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  if (!res.data.ok) throw new Error(`Slack API error on ${endpoint}: ${res.data.error}`);
  return res.data;
}

async function paginateSlack(endpoint, token, params, listKey) {
  const items = [];
  let cursor;
  do {
    const data = await slackGet(endpoint, token, { ...params, cursor, limit: 200 });
    items.push(...(data[listKey] || []));
    cursor = data.response_metadata?.next_cursor;
  } while (cursor);
  return items;
}

async function getWorkspaceInfo(token) {
  const data = await slackGet('auth.test', token);
  return { team: data.team, team_id: data.team_id, url: data.url };
}

// Enterprise Grid: admin.apps.approved.list
async function fetchAdminApps(token) {
  const apps = [];
  let cursor;
  try {
    do {
      const data = await slackGet('admin.apps.approved.list', token, { cursor, limit: 1000 });
      apps.push(...(data.approved_apps || []));
      cursor = data.response_metadata?.next_cursor;
    } while (cursor);
    return { apps, enterprise: true };
  } catch (err) {
    if (err.message.includes('not_allowed_token_type') || err.message.includes('missing_scope')) {
      return { apps: [], enterprise: false };
    }
    throw err;
  }
}

// Fallback for non-Enterprise: list apps via app_manifest or auth info
async function fetchAppsViaAuthorizations(token) {
  const apps = [];
  try {
    const data = await slackGet('apps.connections.open', token);
    if (data.url) apps.push({ source: 'connections', url: data.url });
  } catch { /* non-fatal */ }
  return apps;
}

// Incoming webhooks via channel metadata
async function fetchWebhooks(token) {
  const webhooks = [];
  try {
    const channels = await paginateSlack('conversations.list', token, { types: 'public_channel,private_channel' }, 'channels');
    for (const ch of channels.slice(0, 50)) { // sample to avoid rate limits
      try {
        const info = await slackGet('conversations.info', token, { channel: ch.id, include_all_metadata: true });
        const meta = info.channel?.properties;
        if (meta?.incoming_webhooks?.length) {
          webhooks.push(...meta.incoming_webhooks.map(w => ({ ...w, channel: ch.name })));
        }
      } catch { /* non-fatal per channel */ }
    }
  } catch { /* non-fatal */ }
  return webhooks;
}

function normalizeAdminApp(raw, workspaceInfo) {
  const app = raw.app || raw;
  const scopes = (app.scopes || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);
  return {
    source: 'slack',
    app_id: app.id || app.app_id,
    app_name: app.name || 'Unknown App',
    app_description: app.description || '',
    developer: app.developer_name || '',
    developer_url: app.app_homepage_url || '',
    icon_url: app.app_icon_url || '',
    scopes,
    is_verified: !!(app.is_org_installed || app.app_directory_id),
    privacy_url: app.app_privacy_policy_url || null,
    external_domain: !!app.developer_name,
    user_count: raw.user_count || 0,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    workspace_name: workspaceInfo.team,
    raw_data: raw,
  };
}

function normalizeWebhook(raw) {
  return {
    source: 'slack',
    app_id: `webhook_${raw.hook_id || raw.channel}`,
    app_name: `Incoming Webhook → #${raw.channel || 'unknown'}`,
    app_description: 'Incoming webhook integration',
    developer: '',
    developer_url: '',
    icon_url: '',
    scopes: ['incoming-webhook'],
    is_verified: false,
    privacy_url: null,
    external_domain: true,
    user_count: 0,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    raw_data: raw,
  };
}

async function scanSlack(token) {
  const workspaceInfo = await getWorkspaceInfo(token);
  const { apps: adminApps, enterprise } = await fetchAdminApps(token);
  const webhooks = await fetchWebhooks(token);

  const normalized = [
    ...adminApps.map(a => normalizeAdminApp(a, workspaceInfo)),
    ...webhooks.map(normalizeWebhook),
  ];

  // Deduplicate by app_id
  const seen = new Set();
  const unique = normalized.filter(a => {
    if (seen.has(a.app_id)) return false;
    seen.add(a.app_id);
    return true;
  });

  const scored = unique.map(scoreApp);

  return {
    workspace: workspaceInfo,
    apps: scored,
    enterprise_grid: enterprise,
    scanned_at: new Date().toISOString(),
  };
}

module.exports = { scanSlack };
