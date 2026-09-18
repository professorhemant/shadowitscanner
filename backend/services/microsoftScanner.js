'use strict';

const axios = require('axios');
const { scoreApp } = require('./riskEngine');

const GRAPH = 'https://graph.microsoft.com/v1.0';

async function getToken(tenantId, clientId, clientSecret) {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  });
  const res = await axios.post(url, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data.access_token;
}

async function graphGet(token, path, params = {}) {
  const items = [];
  let url = `${GRAPH}${path}`;
  const headers = { Authorization: `Bearer ${token}` };
  do {
    const res = await axios.get(url, { headers, params: items.length === 0 ? params : {} });
    items.push(...(res.data.value || []));
    url = res.data['@odata.nextLink'] || null;
  } while (url);
  return items;
}

async function getServicePrincipal(token, spId, cache) {
  if (cache.has(spId)) return cache.get(spId);
  try {
    const res = await axios.get(`${GRAPH}/servicePrincipals/${spId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.set(spId, res.data);
    return res.data;
  } catch {
    return null;
  }
}

async function scanMicrosoft(workspace) {
  const { ms_tenant_id: tenantId, ms_client_id: clientId, ms_client_secret: clientSecret } = workspace;
  const token = await getToken(tenantId, clientId, clientSecret);

  // Fetch all delegated permission grants across the tenant
  const grants = await graphGet(token, '/oauth2PermissionGrants');

  // Group by clientId (service principal ID of the app)
  const appMap = new Map();
  for (const grant of grants) {
    const { clientId: spId, scope, principalId, consentType } = grant;
    if (!spId || !scope) continue;
    const scopes = scope.split(/\s+/).filter(Boolean);
    if (!appMap.has(spId)) {
      appMap.set(spId, { spId, scopes: new Set(), users: new Set(), consentType });
    }
    const entry = appMap.get(spId);
    scopes.forEach(s => entry.scopes.add(s));
    if (principalId) entry.users.add(principalId);
  }

  const spCache = new Map();
  const apps = [];

  for (const [spId, entry] of appMap) {
    const sp = await getServicePrincipal(token, spId, spCache);
    if (!sp) continue;

    // Skip first-party Microsoft apps
    const isMicrosoft = sp.appOwnerOrganizationId === 'f8cdef31-a31e-4b4a-93e4-5f571e91255a'
      || (sp.publisherName || '').toLowerCase().includes('microsoft');

    const scopes = Array.from(entry.scopes);
    const appName = sp.displayName || sp.appDisplayName || 'Unknown App';
    const publisher = sp.publisherName || sp.appOwnerOrganizationId || '';
    const privacyUrl = (sp.info && sp.info.privacyStatementUrl) || sp.privacyPolicyUrl || null;
    const isVerified = !!sp.verifiedPublisher?.displayName || isMicrosoft;

    apps.push(scoreApp({
      source: 'microsoft',
      app_id: sp.appId || spId,
      app_name: appName,
      app_description: sp.description || '',
      developer: publisher,
      developer_url: (sp.info && sp.info.marketingUrl) || '',
      icon_url: '',
      scopes,
      is_verified: isVerified,
      privacy_url: privacyUrl,
      external_domain: !isMicrosoft,
      user_count: entry.consentType === 'AllPrincipals' ? 999 : entry.users.size,
      first_seen_at: new Date(),
      last_seen_at: new Date(),
    }));
  }

  return { apps, tenantId };
}

module.exports = { scanMicrosoft };
