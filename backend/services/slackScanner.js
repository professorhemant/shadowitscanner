'use strict';

const axios = require('axios');
const { scoreApp } = require('./riskEngine');

const BASE = 'https://slack.com/api';

async function slackGet(endpoint, token, params = {}) {
  const res = await axios.get(`${BASE}/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  if (!res.data.ok) throw new Error(`Slack API ${endpoint}: ${res.data.error}`);
  return res.data;
}

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
  } catch {
    return { apps: [], enterprise: false };
  }
}

async function fetchWebhooks(token) {
  const webhooks = [];
  try {
    const channels = [];
    let cursor;
    do {
      const d = await slackGet('conversations.list', token, { types: 'public_channel', cursor, limit: 200 });
      channels.push(...(d.channels || []));
      cursor = d.response_metadata?.next_cursor;
    } while (cursor);

    for (const ch of channels.slice(0, 30)) {
      try {
        const info = await slackGet('conversations.info', token, { channel: ch.id, include_all_metadata: true });
        const hooks = info.channel?.properties?.incoming_webhooks || [];
        hooks.forEach(w => webhooks.push({ ...w, channel: ch.name }));
      } catch { /* non-fatal */ }
    }
  } catch { /* non-fatal */ }
  return webhooks;
}

function normalize(raw, workspace) {
  const app = raw.app || raw;
  const scopes = (app.scopes || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
  return scoreApp({
    source: 'slack',
    app_id: app.id || app.app_id,
    app_name: app.name || 'Unknown',
    app_description: app.description || '',
    developer: app.developer_name || '',
    developer_url: app.app_homepage_url || '',
    icon_url: app.app_icon_url || '',
    scopes,
    is_verified: !!(app.is_org_installed || app.app_directory_id),
    privacy_url: app.app_privacy_policy_url || null,
    external_domain: true,
    user_count: raw.user_count || 0,
    first_seen_at: new Date(),
    last_seen_at: new Date(),
  });
}

async function scanSlack(workspace) {
  const token = workspace.slack_user_token || workspace.slack_bot_token;
  const authInfo = await slackGet('auth.test', token);
  const { apps, enterprise } = await fetchAdminApps(token);
  const webhooks = await fetchWebhooks(token);

  const normalized = [
    ...apps.map(a => normalize(a, authInfo)),
    ...webhooks.map(w => normalize({
      app: {
        id: `webhook_${w.hook_id || w.channel}`,
        name: `Incoming Webhook → #${w.channel || 'unknown'}`,
        scopes: ['incoming-webhook'],
        is_org_installed: false,
      },
    }, authInfo)),
  ];

  const seen = new Set();
  const unique = normalized.filter(a => {
    if (seen.has(a.app_id)) return false;
    seen.add(a.app_id);
    return true;
  });

  return { apps: unique, enterprise_grid: enterprise, workspace_name: authInfo.team };
}

module.exports = { scanSlack };
