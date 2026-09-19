'use strict';

const bcrypt = require('bcryptjs');
const { Workspace, ScanRun, DiscoveredApp, User } = require('../models');
const { scoreApp } = require('../services/riskEngine');
const { signToken } = require('../services/tokenService');

const DEMO_EMAIL = 'demo@shadowit.app';
const DEMO_NAME  = 'Demo User';

const DEMO_APPS_RAW = [
  // ── AI Tools ──────────────────────────────────────────────────────────────
  {
    source: 'google', app_id: 'chatgpt-openai-demo',
    app_name: 'ChatGPT', app_description: 'AI assistant by OpenAI', developer: 'OpenAI',
    developer_url: 'https://openai.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    is_verified: false, privacy_url: 'https://openai.com/privacy',
    external_domain: true, user_count: 47,
  },
  {
    source: 'google', app_id: 'grammarly-demo',
    app_name: 'Grammarly', app_description: 'AI writing assistant', developer: 'Grammarly Inc.',
    developer_url: 'https://grammarly.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/documents',
    ],
    is_verified: true, privacy_url: 'https://grammarly.com/privacy',
    external_domain: true, user_count: 89,
  },
  {
    source: 'google', app_id: 'notion-demo',
    app_name: 'Notion', app_description: 'Connected workspace with AI', developer: 'Notion Labs',
    developer_url: 'https://notion.so', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    is_verified: true, privacy_url: 'https://notion.so/privacy',
    external_domain: true, user_count: 23,
  },
  {
    source: 'slack', app_id: 'perplexity-demo',
    app_name: 'Perplexity', app_description: 'AI-powered search', developer: 'Perplexity AI',
    developer_url: 'https://perplexity.ai', icon_url: '',
    scopes: ['channels:history', 'im:history', 'files:read', 'users:read.email'],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 12,
  },
  {
    source: 'microsoft', app_id: 'otter-ai-demo',
    app_name: 'Otter.ai', app_description: 'AI meeting transcription', developer: 'AISense Inc.',
    developer_url: 'https://otter.ai', icon_url: '',
    scopes: ['Calendars.Read', 'Mail.Read', 'User.Read'],
    is_verified: false, privacy_url: 'https://otter.ai/privacy',
    external_domain: true, user_count: 31,
  },
  {
    source: 'slack', app_id: 'github-copilot-demo',
    app_name: 'GitHub Copilot', app_description: 'AI code completion', developer: 'GitHub',
    developer_url: 'https://github.com', icon_url: '',
    scopes: ['chat:write', 'channels:read', 'users:read'],
    is_verified: true, privacy_url: 'https://github.com/privacy',
    external_domain: true, user_count: 15,
  },
  {
    source: 'google', app_id: 'fireflies-demo',
    app_name: 'Fireflies.ai', app_description: 'AI meeting recorder & transcriber', developer: 'Fireflies',
    developer_url: 'https://fireflies.ai', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 28,
  },
  // ── Okta SSO Apps ─────────────────────────────────────────────────────────
  {
    source: 'okta', app_id: 'okta-salesforce-sso-demo',
    app_name: 'Salesforce', app_description: 'SSO type: SAML 2 0', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['USER_PROVISIONING', 'PUSH_NEW_USERS', 'PUSH_USER_DEACTIVATION', 'signOnMode:SAML_2_0'],
    is_verified: true, privacy_url: null,
    external_domain: true, user_count: 134,
  },
  {
    source: 'okta', app_id: 'okta-workday-demo',
    app_name: 'Workday', app_description: 'SSO type: SAML 2 0', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['USER_PROVISIONING', 'PUSH_USER_DEACTIVATION', 'PUSH_GROUPS', 'signOnMode:SAML_2_0'],
    is_verified: true, privacy_url: null,
    external_domain: true, user_count: 87,
  },
  {
    source: 'okta', app_id: 'okta-custom-vpn-demo',
    app_name: 'custom_internal_vpn', app_description: 'SSO type: AUTO LOGIN', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['signOnMode:AUTO_LOGIN'],
    is_verified: false, privacy_url: null,
    external_domain: false, user_count: 200,
  },
  {
    source: 'okta', app_id: 'okta-bamboohr-demo',
    app_name: 'BambooHR', app_description: 'SSO type: SAML 2 0', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['USER_PROVISIONING', 'PUSH_NEW_USERS', 'PUSH_PROFILE_UPDATES', 'signOnMode:SAML_2_0'],
    is_verified: true, privacy_url: null,
    external_domain: true, user_count: 67,
  },
  // ── Regular (non-AI) apps ─────────────────────────────────────────────────
  {
    source: 'microsoft', app_id: 'datasync-pro-demo',
    app_name: 'DataSync Pro', app_description: '', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['Directory.ReadWrite.All', 'User.ReadWrite.All', 'Mail.ReadWrite', 'Files.ReadWrite.All'],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 5,
  },
  {
    source: 'google', app_id: 'salesforce-demo',
    app_name: 'Salesforce', app_description: 'CRM platform', developer: 'Salesforce.com',
    developer_url: 'https://salesforce.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/contacts',
    ],
    is_verified: true, privacy_url: 'https://salesforce.com/privacy',
    external_domain: true, user_count: 102,
  },
  {
    source: 'slack', app_id: 'zapier-demo',
    app_name: 'Zapier', app_description: 'Automation workflows', developer: 'Zapier Inc.',
    developer_url: 'https://zapier.com', icon_url: '',
    scopes: ['chat:write', 'channels:read', 'files:read', 'users:read', 'workflows:steps:execute'],
    is_verified: true, privacy_url: 'https://zapier.com/privacy',
    external_domain: true, user_count: 8,
  },
  {
    source: 'google', app_id: 'docusign-demo',
    app_name: 'DocuSign', app_description: 'Electronic signatures', developer: 'DocuSign Inc.',
    developer_url: 'https://docusign.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    is_verified: true, privacy_url: 'https://docusign.com/privacy',
    external_domain: true, user_count: 44,
  },
  {
    source: 'slack', app_id: 'hubspot-demo',
    app_name: 'HubSpot', app_description: 'CRM and marketing platform', developer: 'HubSpot',
    developer_url: 'https://hubspot.com', icon_url: '',
    scopes: ['chat:write', 'channels:read', 'users:read.email', 'im:history'],
    is_verified: true, privacy_url: 'https://hubspot.com/privacy',
    external_domain: true, user_count: 19,
  },
];

async function _seedWorkspace(userId, workspaceId) {
  const now = new Date();
  const scored = DEMO_APPS_RAW.map(a => scoreApp({ ...a, first_seen_at: now, last_seen_at: now }));
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of scored) counts[a.risk_level]++;

  const run = await ScanRun.create({
    workspace_id: workspaceId,
    triggered_by: 'manual',
    source: 'google',
    status: 'running',
    started_at: new Date(Date.now() - 45000),
  });

  await DiscoveredApp.bulkCreate(
    scored.map(a => ({
      scan_run_id: run.id,
      workspace_id: workspaceId,
      source: a.source,
      app_id: a.app_id,
      app_name: a.app_name,
      app_description: a.app_description || '',
      developer: a.developer || '',
      developer_url: a.developer_url || '',
      icon_url: a.icon_url || '',
      scopes: a.scopes,
      raw_data: {},
      is_verified: !!a.is_verified,
      risk_score: a.risk_score,
      risk_level: a.risk_level,
      risk_factors: a.risk_factors,
      has_admin_scope: !!a.has_admin_scope,
      has_write_scope: !!a.has_write_scope,
      accesses_email: !!a.accesses_email,
      accesses_calendar: !!a.accesses_calendar,
      accesses_drive: !!a.accesses_drive,
      external_domain: !!a.external_domain,
      user_count: a.user_count || 0,
      is_ai_tool: !!a.is_ai_tool,
      ai_risk_flags: a.ai_risk_flags || null,
      first_seen_at: now,
      last_seen_at: now,
    })),
    { ignoreDuplicates: true }
  );

  await run.update({
    status: 'completed',
    apps_found: scored.length,
    critical_count: counts.critical,
    high_count: counts.high,
    medium_count: counts.medium,
    low_count: counts.low,
    completed_at: new Date(),
  });

  await Workspace.update({ last_scan_at: new Date() }, { where: { id: workspaceId } });
  return { scored, counts };
}

async function demoLogin(req, res, next) {
  try {
    // Find or create the demo user
    let user = await User.findOne({ where: { email: DEMO_EMAIL } });
    if (!user) {
      const password_hash = await bcrypt.hash('demo-' + Date.now(), 10);
      user = await User.create({ name: DEMO_NAME, email: DEMO_EMAIL, password_hash, is_verified: true, plan: 'pro' });
    }

    // Find or create demo workspace
    let ws = await Workspace.findOne({ where: { user_id: user.id, name: 'Acme Corp (Demo)' } });
    const fresh = !ws;
    if (!ws) {
      ws = await Workspace.create({
        user_id: user.id,
        name: 'Acme Corp (Demo)',
        type: 'google',
        google_domain: 'acmecorp.com',
        google_admin_email: 'admin@acmecorp.com',
        is_active: true,
      });
    }

    // Seed data only on first creation
    if (fresh) {
      await _seedWorkspace(user.id, ws.id);
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: DEMO_NAME, email: DEMO_EMAIL, plan: 'pro', is_demo: true },
      workspace_id: ws.id,
    });
  } catch (err) { next(err); }
}

async function seedDemo(req, res, next) {
  try {
    let ws = await Workspace.findOne({ where: { user_id: req.user.id, name: 'Demo Workspace (Acme Corp)' } });
    if (!ws) {
      ws = await Workspace.create({
        user_id: req.user.id,
        name: 'Demo Workspace (Acme Corp)',
        type: 'google',
        google_domain: 'acmecorp.com',
        google_admin_email: 'admin@acmecorp.com',
        is_active: true,
      });
    }
    const { scored, counts } = await _seedWorkspace(req.user.id, ws.id);
    res.json({
      message: 'Demo data loaded',
      workspace_id: ws.id,
      apps_created: scored.length,
      ai_tools_detected: scored.filter(a => a.is_ai_tool).length,
      counts,
    });
  } catch (err) { next(err); }
}

module.exports = { seedDemo, demoLogin, DEMO_APPS_RAW };
