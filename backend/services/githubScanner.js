'use strict';

const axios = require('axios');
const { scoreApp } = require('./riskEngine');

const GH = 'https://api.github.com';

function ghClient(pat) {
  return axios.create({
    baseURL: GH,
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

// Map GitHub permission keys to meaningful scope strings
function permissionsToScopes(permissions = {}) {
  const scopes = [];
  for (const [key, level] of Object.entries(permissions)) {
    scopes.push(`${key}:${level}`);
  }
  return scopes;
}

function formatAppName(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Fetch GitHub Apps installed on an org (requires org admin or owner)
async function fetchOrgInstallations(client, org) {
  const apps = [];
  try {
    let page = 1;
    while (true) {
      const { data } = await client.get(`/orgs/${org}/installations`, {
        params: { per_page: 100, page },
      });
      const items = data.installations || [];
      apps.push(...items);
      if (items.length < 100) break;
      page++;
    }
  } catch {
    // Not org admin — skip, fall back to other methods
  }
  return apps;
}

// Fetch org-level webhooks
async function fetchOrgHooks(client, org) {
  try {
    const { data } = await client.get(`/orgs/${org}/hooks`);
    return data || [];
  } catch {
    return [];
  }
}

// Fetch user's repos (for repo-level hook scanning)
async function fetchRepos(client, org) {
  const repos = [];
  try {
    let page = 1;
    while (repos.length < 50) {  // cap at 50 repos to avoid rate limit
      const { data } = await client.get(`/orgs/${org}/repos`, {
        params: { per_page: 30, page, sort: 'pushed', type: 'all' },
      });
      repos.push(...data);
      if (data.length < 30) break;
      page++;
    }
  } catch {
    // May not have org read access
  }
  return repos;
}

// Fetch webhooks for a single repo
async function fetchRepoHooks(client, owner, repo) {
  try {
    const { data } = await client.get(`/repos/${owner}/${repo}/hooks`);
    return data || [];
  } catch {
    return [];
  }
}

function normalizeInstallation(inst, org) {
  const slug = inst.app_slug || `github-app-${inst.app_id}`;
  const scopes = permissionsToScopes(inst.permissions || {});
  const hasAdmin = Object.values(inst.permissions || {}).includes('admin');
  const hasWrite = Object.values(inst.permissions || {}).includes('write');

  return scoreApp({
    source: 'github',
    app_id: `github-app-${inst.app_id}`,
    app_name: formatAppName(slug),
    app_description: `GitHub App installed on ${org}`,
    developer: inst.account?.login || 'GitHub Marketplace',
    developer_url: `https://github.com/apps/${slug}`,
    is_verified: true,
    scopes,
    user_count: inst.repositories_count || 0,
    raw_data: inst,
  });
}

function normalizeWebhook(hook, repoName) {
  const url = hook.config?.url || '';
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url.slice(0, 40); } })();
  const isExternal = hostname && !hostname.includes('github') && !hostname.includes('localhost');
  const events = hook.events || [];

  return scoreApp({
    source: 'github',
    app_id: `github-webhook-${hook.id}`,
    app_name: hostname || 'Unknown Webhook',
    app_description: repoName ? `Repository webhook on ${repoName}` : 'Org-level webhook',
    developer: hostname,
    developer_url: url,
    is_verified: false,
    scopes: events.map(e => `webhook:${e}`),
    user_count: 0,
    raw_data: hook,
  });
}

async function scanGithub(ws) {
  const pat = ws.github_pat;
  const org = ws.github_org;
  if (!pat || !org) throw new Error('GitHub PAT and org name are required');

  const client = ghClient(pat);
  const apps = [];
  const seenWebhooks = new Set();

  // 1. GitHub Apps installed on the org
  const installations = await fetchOrgInstallations(client, org);
  for (const inst of installations) {
    apps.push(normalizeInstallation(inst, org));
  }

  // 2. Org-level webhooks
  const orgHooks = await fetchOrgHooks(client, org);
  for (const hook of orgHooks) {
    if (!seenWebhooks.has(hook.id)) {
      seenWebhooks.add(hook.id);
      apps.push(normalizeWebhook(hook, null));
    }
  }

  // 3. Repo-level webhooks (sample top repos)
  const repos = await fetchRepos(client, org);
  const repoHookPromises = repos.slice(0, 20).map(async repo => {
    const hooks = await fetchRepoHooks(client, org, repo.name);
    return { repoName: repo.full_name, hooks };
  });
  const repoHookResults = await Promise.all(repoHookPromises);
  for (const { repoName, hooks } of repoHookResults) {
    for (const hook of hooks) {
      if (!seenWebhooks.has(hook.id)) {
        seenWebhooks.add(hook.id);
        apps.push(normalizeWebhook(hook, repoName));
      }
    }
  }

  return { apps };
}

module.exports = { scanGithub };
