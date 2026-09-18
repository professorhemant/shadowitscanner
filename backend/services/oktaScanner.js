'use strict';

const axios = require('axios');
const { scoreApp } = require('./riskEngine');

async function oktaGet(baseUrl, path, token) {
  const items = [];
  let url = `${baseUrl}${path}`;
  const headers = { Authorization: `SSWS ${token}`, Accept: 'application/json' };

  do {
    const res = await axios.get(url, { headers });
    items.push(...(res.data || []));
    // Follow Okta pagination via Link header
    const link = res.headers['link'] || '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  } while (url);

  return items;
}

async function getUserCount(baseUrl, appId, token) {
  try {
    const headers = { Authorization: `SSWS ${token}`, Accept: 'application/json' };
    // Fetch first 200 users; if exactly 200, actual count is 200+
    const res = await axios.get(`${baseUrl}/apps/${appId}/users?limit=200`, { headers });
    return res.data?.length || 0;
  } catch {
    return 0;
  }
}

function buildScopes(app) {
  const scopes = [];
  const features = app.features || [];
  features.forEach(f => scopes.push(f));
  if (app.signOnMode) scopes.push(`signOnMode:${app.signOnMode}`);
  return scopes;
}

async function scanOkta(workspace) {
  const { okta_domain, okta_api_token } = workspace;
  const baseUrl = `https://${okta_domain}/api/v1`;

  // Fetch all active apps
  const rawApps = await oktaGet(baseUrl, '/apps?limit=200&filter=status%20eq%20%22ACTIVE%22', okta_api_token);

  // Parallel user count fetches (batched to avoid rate limits)
  const BATCH = 10;
  const withCounts = [];
  for (let i = 0; i < rawApps.length; i += BATCH) {
    const batch = rawApps.slice(i, i + BATCH);
    const counts = await Promise.all(batch.map(a => getUserCount(baseUrl, a.id, okta_api_token)));
    batch.forEach((a, j) => withCounts.push({ app: a, userCount: counts[j] }));
  }

  const apps = withCounts.map(({ app, userCount }) => {
    const scopes = buildScopes(app);
    const isInOIN = app.name && !app.name.startsWith('custom_') && !!app._links?.logo;
    const logoHref = app._links?.logo?.[0]?.href || '';
    const selfService = !!(app.accessibility && app.accessibility.selfService);

    const baseApp = {
      source: 'okta',
      app_id: app.id,
      app_name: app.label || app.name || 'Unknown App',
      app_description: app.signOnMode ? `SSO type: ${app.signOnMode.replace(/_/g, ' ')}` : '',
      developer: '',
      developer_url: '',
      icon_url: logoHref,
      scopes,
      is_verified: isInOIN,
      privacy_url: null,
      external_domain: true,
      user_count: userCount,
      first_seen_at: app.created ? new Date(app.created) : new Date(),
      last_seen_at: app.lastUpdated ? new Date(app.lastUpdated) : new Date(),
      raw_data: { signOnMode: app.signOnMode, features: app.features, selfService, status: app.status },
    };

    // Add extra pre-scored factors for self-service
    const scored = scoreApp(baseApp);
    if (selfService) {
      scored.risk_score = Math.min(scored.risk_score + 10, 100);
      scored.risk_factors.push({ factor: 'okta_self_service', weight: 10, detail: 'Users can self-enroll without IT approval' });
    }
    return scored;
  });

  return { apps, domain: okta_domain };
}

module.exports = { scanOkta };
