'use strict';

const axios = require('axios');
const { scoreApp } = require('./riskEngine');

// Known Atlassian-first-party vendors — not shadow IT
const ATLASSIAN_VENDORS = new Set([
  'atlassian', 'atlassian pty ltd', 'atlassian network services', 'atlassian inc',
]);

// Known high-risk / external SaaS vendors common in Atlassian environments
const KNOWN_CATEGORIES = {
  'github': 'DevOps',
  'gitlab': 'DevOps',
  'jenkins': 'DevOps',
  'bitbucket': 'DevOps',
  'circleci': 'DevOps',
  'datadog': 'Monitoring',
  'pagerduty': 'Monitoring',
  'sentry': 'Monitoring',
  'salesforce': 'CRM',
  'hubspot': 'CRM',
  'zendesk': 'Support',
  'slack': 'Communication',
  'microsoft': 'Productivity',
  'google': 'Productivity',
  'figma': 'Design',
  'miro': 'Collaboration',
  'lucidchart': 'Collaboration',
  'zoom': 'Communication',
  'docusign': 'Legal',
};

function categorize(name, vendor) {
  const needle = (name + ' ' + vendor).toLowerCase();
  for (const [kw, cat] of Object.entries(KNOWN_CATEGORIES)) {
    if (needle.includes(kw)) return cat;
  }
  return 'Other';
}

function basicAuth(email, apiToken) {
  return 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
}

async function fetchPlugins(domain, email, apiToken) {
  const auth = basicAuth(email, apiToken);
  const base = `https://${domain}`;

  // Try Jira/Confluence plugin API
  try {
    const { data } = await axios.get(`${base}/rest/plugins/1.0/`, {
      headers: { Authorization: auth, Accept: 'application/json' },
      timeout: 15000,
    });
    return data?.plugins || [];
  } catch {
    return [];
  }
}

async function fetchConnectApps(domain, email, apiToken) {
  const auth = basicAuth(email, apiToken);
  const base = `https://${domain}`;

  // Try Atlassian Connect addon listing
  try {
    const { data } = await axios.get(`${base}/rest/atlassian-connect/1/addons`, {
      headers: { Authorization: auth, Accept: 'application/json' },
      timeout: 15000,
    });
    return Array.isArray(data) ? data : (data?.values || []);
  } catch {
    return [];
  }
}

function normalizePlugin(plugin, source) {
  const name = plugin.name || plugin.key || 'Unknown Plugin';
  const vendor = (plugin.vendor?.name || plugin.vendorName || 'Unknown').toLowerCase();
  const key = plugin.key || plugin.addonKey || name.toLowerCase().replace(/\s+/g, '-');
  const isAtlassian = ATLASSIAN_VENDORS.has(vendor);
  const isUserInstalled = plugin.userInstalled !== false;

  // Derive scopes from plugin permissions/modules
  const scopes = [];
  if (plugin.scopes) {
    scopes.push(...(Array.isArray(plugin.scopes) ? plugin.scopes : [plugin.scopes]));
  }
  if (plugin.modules) {
    const moduleTypes = Object.keys(plugin.modules || {});
    scopes.push(...moduleTypes.map(m => `jira:${m}`));
  }
  if (scopes.length === 0) scopes.push('jira:read', 'jira:write');

  return scoreApp({
    source,
    app_id: `jira-${key}`,
    app_name: name,
    app_description: plugin.description || `Jira/Confluence plugin by ${vendor}`,
    developer: plugin.vendor?.name || plugin.vendorName || vendor,
    developer_url: plugin.vendor?.url || plugin.marketplaceUrl || '',
    is_verified: isAtlassian || !!plugin.links?.marketplace,
    scopes,
    user_count: 0,
    raw_data: plugin,
  });
}

async function scanJira(ws) {
  const domain = ws.jira_domain;
  const email = ws.jira_email;
  const apiToken = ws.jira_api_token;
  if (!domain || !email || !apiToken) throw new Error('Jira domain, email, and API token are required');

  const apps = [];
  const seen = new Set();

  const [plugins, connectApps] = await Promise.all([
    fetchPlugins(domain, email, apiToken),
    fetchConnectApps(domain, email, apiToken),
  ]);

  // Process plugins
  for (const plugin of plugins) {
    if (!plugin.enabled) continue;  // skip disabled plugins
    const key = plugin.key || plugin.name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    // Skip Atlassian system plugins (not shadow IT)
    const vendor = (plugin.vendor?.name || '').toLowerCase();
    if (ATLASSIAN_VENDORS.has(vendor) && !plugin.userInstalled) continue;
    apps.push(normalizePlugin(plugin, 'jira'));
  }

  // Process Connect apps (may overlap with plugins)
  for (const app of connectApps) {
    const key = app.key || app.addonKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    apps.push(normalizePlugin(app, 'jira'));
  }

  return { apps };
}

module.exports = { scanJira };
