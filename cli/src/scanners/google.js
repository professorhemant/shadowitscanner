'use strict';

const { google } = require('googleapis');
const { scoreApp } = require('../scoring/engine');

async function buildAuthClient(credentialsPath, adminEmail) {
  const key = require(credentialsPath);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    ],
    subject: adminEmail,
  });
  await auth.authorize();
  return auth;
}

async function fetchTokenActivities(auth, domain) {
  const reports = google.admin({ version: 'reports_v1', auth });
  const activities = [];
  let pageToken;

  do {
    const res = await reports.activities.list({
      userKey: 'all',
      applicationName: 'token',
      maxResults: 1000,
      pageToken,
    });
    activities.push(...(res.data.items || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return activities;
}

function extractAppsFromActivities(activities) {
  const appMap = new Map();

  for (const item of activities) {
    const events = item.events || [];
    for (const event of events) {
      if (event.type !== 'authorize') continue;
      const params = {};
      for (const p of event.parameters || []) {
        params[p.name] = p.value || (p.multiValue ? p.multiValue.join(' ') : '');
      }

      const appName = params.app_name;
      const clientId = params.client_id;
      if (!appName || !clientId) continue;

      const scopeStr = params.scope || '';
      const scopes = scopeStr.split(/\s+/).filter(Boolean);

      if (!appMap.has(clientId)) {
        appMap.set(clientId, {
          app_name: appName,
          client_id: clientId,
          scopes: new Set(scopes),
          users: new Set(),
          first_seen: item.id?.time,
          last_seen: item.id?.time,
        });
      } else {
        const existing = appMap.get(clientId);
        scopes.forEach(s => existing.scopes.add(s));
        existing.last_seen = item.id?.time;
      }

      const actor = item.actor?.email;
      if (actor) appMap.get(clientId).users.add(actor);
    }
  }

  return Array.from(appMap.values());
}

function normalizeGoogleApp(raw, domain) {
  const scopes = Array.from(raw.scopes);
  const orgDomainScopes = ['https://www.googleapis.com', 'https://accounts.google.com'];
  const isGoogleOwned = raw.app_name.toLowerCase().includes('google') ||
    raw.client_id.endsWith('.apps.googleusercontent.com');

  // External domain = app not built by the workspace's own org (heuristic)
  const external_domain = !isGoogleOwned;

  return {
    source: 'google',
    app_id: raw.client_id,
    app_name: raw.app_name,
    app_description: '',
    developer: isGoogleOwned ? 'Google LLC' : 'Third-party developer',
    developer_url: '',
    icon_url: '',
    scopes,
    is_verified: isGoogleOwned,
    privacy_url: null,
    external_domain,
    user_count: raw.users.size,
    first_seen_at: raw.first_seen || new Date().toISOString(),
    last_seen_at: raw.last_seen || new Date().toISOString(),
    raw_data: { client_id: raw.client_id, scopes, user_count: raw.users.size },
  };
}

async function scanGoogle(credentialsPath, adminEmail, domain) {
  const auth = await buildAuthClient(credentialsPath, adminEmail);
  const activities = await fetchTokenActivities(auth, domain);
  const rawApps = extractAppsFromActivities(activities);

  const normalized = rawApps.map(r => normalizeGoogleApp(r, domain));

  // Filter out first-party Google apps (low noise)
  const thirdParty = normalized.filter(a => !a.is_verified || a.external_domain);
  const all = normalized;

  const scored = all.map(scoreApp);

  return {
    workspace: { domain, admin: adminEmail },
    apps: scored,
    total_users_scanned: new Set(
      activities.flatMap(a => a.actor?.email ? [a.actor.email] : [])
    ).size,
    scanned_at: new Date().toISOString(),
  };
}

module.exports = { scanGoogle };
