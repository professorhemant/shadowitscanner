'use strict';

const { google } = require('googleapis');
const { scoreApp } = require('./riskEngine');

async function buildAuth(serviceAccount, adminEmail) {
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    ],
    subject: adminEmail,
  });
  await auth.authorize();
  return auth;
}

async function fetchActivities(auth) {
  const reports = google.admin({ version: 'reports_v1', auth });
  const items = [];
  let pageToken;
  do {
    const res = await reports.activities.list({
      userKey: 'all',
      applicationName: 'token',
      maxResults: 1000,
      pageToken,
    });
    items.push(...(res.data.items || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return items;
}

function extractApps(activities) {
  const map = new Map();
  for (const item of activities) {
    for (const event of item.events || []) {
      if (event.type !== 'authorize') continue;
      const p = {};
      for (const param of event.parameters || []) {
        p[param.name] = param.value || (param.multiValue ? param.multiValue.join(' ') : '');
      }
      const { app_name, client_id, scope } = p;
      if (!app_name || !client_id) continue;
      const scopes = (scope || '').split(/\s+/).filter(Boolean);
      if (!map.has(client_id)) {
        map.set(client_id, { app_name, client_id, scopes: new Set(scopes), users: new Set(), first_seen: item.id?.time, last_seen: item.id?.time });
      } else {
        scopes.forEach(s => map.get(client_id).scopes.add(s));
        map.get(client_id).last_seen = item.id?.time;
      }
      if (item.actor?.email) map.get(client_id).users.add(item.actor.email);
    }
  }
  return Array.from(map.values());
}

async function scanGoogle(workspace) {
  const sa = workspace.google_service_account;
  const auth = await buildAuth(sa, workspace.google_admin_email);
  const activities = await fetchActivities(auth);
  const raw = extractApps(activities);

  const apps = raw.map(r => {
    const scopes = Array.from(r.scopes);
    const isGoogle = r.app_name.toLowerCase().includes('google');
    return scoreApp({
      source: 'google',
      app_id: r.client_id,
      app_name: r.app_name,
      app_description: '',
      developer: isGoogle ? 'Google LLC' : 'Third-party',
      developer_url: '',
      icon_url: '',
      scopes,
      is_verified: isGoogle,
      privacy_url: null,
      external_domain: !isGoogle,
      user_count: r.users.size,
      first_seen_at: r.first_seen ? new Date(r.first_seen) : new Date(),
      last_seen_at: r.last_seen ? new Date(r.last_seen) : new Date(),
    });
  });

  return { apps, domain: workspace.google_domain };
}

module.exports = { scanGoogle };
