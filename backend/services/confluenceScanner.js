'use strict';

const axios = require('axios');
const { scoreApp } = require('./riskEngine');

const ATLASSIAN_VENDORS = new Set([
  'atlassian', 'atlassian pty ltd', 'atlassian network services', 'atlassian inc',
]);

function basicAuth(email, token) {
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
}

async function fetchConnectApps(base, auth) {
  try {
    const { data } = await axios.get(`${base}/wiki/rest/atlassian-connect/1/addons`, {
      headers: { Authorization: auth, Accept: 'application/json' },
      timeout: 15000,
    });
    return Array.isArray(data) ? data : (data?.values || []);
  } catch {
    return [];
  }
}

async function fetchPublicSpaces(base, auth) {
  const spaces = [];
  let url = `${base}/wiki/rest/api/space?type=global&limit=250&expand=permissions`;
  while (url) {
    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: auth, Accept: 'application/json' },
        timeout: 15000,
      });
      spaces.push(...(data.results || []));
      url = data._links?.next ? `${base}${data._links.next}` : null;
    } catch { break; }
  }
  return spaces.filter(s => {
    const perms = s.permissions || [];
    return perms.some(p =>
      p.anonymousAccess === true ||
      p.subjects?.user?.results?.some(u => u.type === 'anonymous')
    );
  });
}

function normalizeAddon(addon) {
  const name = addon.name || addon.key || 'Unknown App';
  const vendor = (addon.vendor?.name || addon.vendorName || 'Unknown').toLowerCase();
  const key = addon.key || addon.addonKey || name.toLowerCase().replace(/\s+/g, '-');
  const scopes = addon.scopes?.length
    ? addon.scopes
    : ['confluence:read', 'confluence:write'];

  return scoreApp({
    source: 'confluence',
    app_id: `confluence-${key}`,
    app_name: name,
    app_description: addon.description || `Confluence app by ${addon.vendor?.name || vendor}`,
    developer: addon.vendor?.name || vendor,
    developer_url: addon.vendor?.url || addon.marketplaceUrl || '',
    icon_url: '',
    is_verified: ATLASSIAN_VENDORS.has(vendor) || !!addon.links?.marketplace,
    scopes,
    user_count: 0,
    external_domain: !ATLASSIAN_VENDORS.has(vendor),
    first_seen_at: addon.created ? new Date(addon.created) : new Date(),
    last_seen_at: new Date(),
    raw_data: addon,
  });
}

async function scanConfluence(ws) {
  const { confluence_domain: domain, confluence_email: email, confluence_api_token: token } = ws;
  if (!domain || !email || !token) throw new Error('Confluence domain, email, and API token are required');

  const base = `https://${domain}`;
  const auth = basicAuth(email, token);
  const seen = new Set();
  const apps = [];

  const [connectApps, publicSpaces] = await Promise.all([
    fetchConnectApps(base, auth),
    fetchPublicSpaces(base, auth),
  ]);

  // Third-party Connect apps installed in Confluence
  for (const addon of connectApps) {
    const key = addon.key || addon.addonKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const vendor = (addon.vendor?.name || '').toLowerCase();
    if (ATLASSIAN_VENDORS.has(vendor)) continue;
    apps.push(normalizeAddon(addon));
  }

  // Publicly accessible spaces — shadow data exposure vector
  for (const space of publicSpaces) {
    const key = `public-space-${space.key}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const scored = scoreApp({
      source: 'confluence',
      app_id: `confluence-space-${space.key}`,
      app_name: `Space: ${space.name} (Public Access)`,
      app_description: 'Confluence space accessible to anonymous/unauthenticated users',
      developer: 'Internal',
      developer_url: '',
      icon_url: '',
      is_verified: false,
      scopes: ['confluence:read', 'confluence:anonymous_access'],
      user_count: 0,
      external_domain: true,
      first_seen_at: new Date(),
      last_seen_at: new Date(),
      raw_data: { type: 'public_space', key: space.key, name: space.name },
    });
    // Public spaces are a significant data exposure risk
    scored.risk_score = Math.min(scored.risk_score + 20, 100);
    scored.risk_factors.push({
      factor: 'confluence_public_space',
      weight: 20,
      detail: `Space "${space.name}" allows anonymous access — internal content may be publicly readable`,
    });
    apps.push(scored);
  }

  return { apps, domain };
}

module.exports = { scanConfluence };
