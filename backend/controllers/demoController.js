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
  // ── More AI Tools ─────────────────────────────────────────────────────────
  {
    source: 'microsoft', app_id: 'copilot-m365-demo',
    app_name: 'Microsoft Copilot', app_description: 'AI assistant embedded in M365 suite', developer: 'Microsoft',
    developer_url: 'https://microsoft.com', icon_url: '',
    scopes: ['Mail.ReadWrite', 'Files.ReadWrite.All', 'Calendars.ReadWrite', 'Chat.ReadWrite', 'User.Read'],
    is_verified: true, privacy_url: 'https://microsoft.com/privacy',
    external_domain: false, user_count: 210,
  },
  {
    source: 'google', app_id: 'jasper-ai-demo',
    app_name: 'Jasper', app_description: 'AI marketing copy generator', developer: 'Jasper AI Inc.',
    developer_url: 'https://jasper.ai', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/gmail.compose',
    ],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 9,
  },
  {
    source: 'slack', app_id: 'midjourney-demo',
    app_name: 'Midjourney', app_description: 'AI image generation', developer: 'Midjourney Inc.',
    developer_url: 'https://midjourney.com', icon_url: '',
    scopes: ['channels:history', 'chat:write', 'files:write', 'users:read'],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 6,
  },
  {
    source: 'google', app_id: 'cursor-ai-demo',
    app_name: 'Cursor', app_description: 'AI-powered code editor', developer: 'Anysphere Inc.',
    developer_url: 'https://cursor.sh', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 18,
  },
  {
    source: 'microsoft', app_id: 'synthesia-demo',
    app_name: 'Synthesia', app_description: 'AI video creation platform', developer: 'Synthesia Ltd.',
    developer_url: 'https://synthesia.io', icon_url: '',
    scopes: ['User.Read', 'Files.Read', 'Mail.Read'],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 4,
  },
  {
    source: 'slack', app_id: 'elevenlabs-demo',
    app_name: 'ElevenLabs', app_description: 'AI voice cloning & text-to-speech', developer: 'ElevenLabs Inc.',
    developer_url: 'https://elevenlabs.io', icon_url: '',
    scopes: ['channels:history', 'files:read', 'users:read.email'],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 3,
  },
  // ── Design & Productivity ─────────────────────────────────────────────────
  {
    source: 'google', app_id: 'figma-demo',
    app_name: 'Figma', app_description: 'Collaborative design tool', developer: 'Figma Inc.',
    developer_url: 'https://figma.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    is_verified: true, privacy_url: 'https://figma.com/privacy',
    external_domain: true, user_count: 34,
  },
  {
    source: 'google', app_id: 'canva-demo',
    app_name: 'Canva', app_description: 'Online design and publishing tool', developer: 'Canva Pty Ltd',
    developer_url: 'https://canva.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    is_verified: true, privacy_url: 'https://canva.com/privacy',
    external_domain: true, user_count: 58,
  },
  {
    source: 'google', app_id: 'zoom-demo',
    app_name: 'Zoom', app_description: 'Video conferencing', developer: 'Zoom Video Communications',
    developer_url: 'https://zoom.us', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    is_verified: true, privacy_url: 'https://zoom.us/privacy',
    external_domain: true, user_count: 187,
  },
  {
    source: 'slack', app_id: 'loom-demo',
    app_name: 'Loom', app_description: 'Async video messaging', developer: 'Loom Inc.',
    developer_url: 'https://loom.com', icon_url: '',
    scopes: ['chat:write', 'channels:read', 'files:write'],
    is_verified: true, privacy_url: 'https://loom.com/privacy',
    external_domain: true, user_count: 41,
  },
  // ── Project Management ────────────────────────────────────────────────────
  {
    source: 'slack', app_id: 'asana-demo',
    app_name: 'Asana', app_description: 'Work management platform', developer: 'Asana Inc.',
    developer_url: 'https://asana.com', icon_url: '',
    scopes: ['chat:write', 'channels:read', 'users:read', 'im:history'],
    is_verified: true, privacy_url: 'https://asana.com/privacy',
    external_domain: true, user_count: 63,
  },
  {
    source: 'microsoft', app_id: 'monday-demo',
    app_name: 'Monday.com', app_description: 'Team project management', developer: 'monday.com Ltd.',
    developer_url: 'https://monday.com', icon_url: '',
    scopes: ['User.Read', 'Files.ReadWrite', 'Calendars.Read'],
    is_verified: true, privacy_url: 'https://monday.com/privacy',
    external_domain: true, user_count: 29,
  },
  {
    source: 'google', app_id: 'airtable-demo',
    app_name: 'Airtable', app_description: 'Low-code database and spreadsheet hybrid', developer: 'Formagrid Inc.',
    developer_url: 'https://airtable.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
    is_verified: true, privacy_url: 'https://airtable.com/privacy',
    external_domain: true, user_count: 16,
  },
  // ── DevOps & Engineering ──────────────────────────────────────────────────
  {
    source: 'github', app_id: 'github-sentry-demo',
    app_name: 'Sentry', app_description: 'Error tracking & performance monitoring', developer: 'Functional Software Inc.',
    developer_url: 'https://sentry.io', icon_url: '',
    scopes: ['repo', 'read:org', 'read:user'],
    is_verified: true, privacy_url: 'https://sentry.io/privacy',
    external_domain: true, user_count: 22,
  },
  {
    source: 'github', app_id: 'github-datadog-demo',
    app_name: 'Datadog', app_description: 'Cloud monitoring & analytics', developer: 'Datadog Inc.',
    developer_url: 'https://datadoghq.com', icon_url: '',
    scopes: ['repo', 'read:org', 'admin:repo_hook'],
    is_verified: true, privacy_url: 'https://datadoghq.com/privacy',
    external_domain: true, user_count: 14,
  },
  {
    source: 'github', app_id: 'github-circleci-demo',
    app_name: 'CircleCI', app_description: 'CI/CD platform', developer: 'Circle Internet Services',
    developer_url: 'https://circleci.com', icon_url: '',
    scopes: ['repo', 'read:org', 'admin:repo_hook', 'write:repo_hook'],
    is_verified: true, privacy_url: 'https://circleci.com/privacy',
    external_domain: true, user_count: 11,
  },
  {
    source: 'slack', app_id: 'pagerduty-demo',
    app_name: 'PagerDuty', app_description: 'Incident management platform', developer: 'PagerDuty Inc.',
    developer_url: 'https://pagerduty.com', icon_url: '',
    scopes: ['chat:write', 'channels:read', 'users:read', 'commands'],
    is_verified: true, privacy_url: 'https://pagerduty.com/privacy',
    external_domain: true, user_count: 9,
  },
  // ── Marketing & Sales ─────────────────────────────────────────────────────
  {
    source: 'google', app_id: 'mailchimp-demo',
    app_name: 'Mailchimp', app_description: 'Email marketing platform', developer: 'The Rocket Science Group',
    developer_url: 'https://mailchimp.com', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/contacts.readonly',
    ],
    is_verified: true, privacy_url: 'https://mailchimp.com/privacy',
    external_domain: true, user_count: 7,
  },
  {
    source: 'microsoft', app_id: 'semrush-demo',
    app_name: 'SEMrush', app_description: 'SEO and marketing analytics', developer: 'Semrush Holdings',
    developer_url: 'https://semrush.com', icon_url: '',
    scopes: ['User.Read', 'Files.Read'],
    is_verified: false, privacy_url: 'https://semrush.com/privacy',
    external_domain: true, user_count: 5,
  },
  // ── HR & Finance ──────────────────────────────────────────────────────────
  {
    source: 'okta', app_id: 'okta-rippling-demo',
    app_name: 'Rippling', app_description: 'HR & IT management platform — SSO type: SAML 2.0', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['USER_PROVISIONING', 'PUSH_NEW_USERS', 'PUSH_USER_DEACTIVATION', 'PUSH_GROUPS', 'signOnMode:SAML_2_0'],
    is_verified: true, privacy_url: null,
    external_domain: true, user_count: 145,
  },
  {
    source: 'okta', app_id: 'okta-expensify-demo',
    app_name: 'Expensify', app_description: 'Expense management — SSO type: SAML 2.0', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['USER_PROVISIONING', 'PUSH_NEW_USERS', 'signOnMode:SAML_2_0'],
    is_verified: true, privacy_url: null,
    external_domain: true, user_count: 78,
  },
  {
    source: 'microsoft', app_id: 'brex-demo',
    app_name: 'Brex', app_description: 'Corporate cards & spend management', developer: 'Brex Inc.',
    developer_url: 'https://brex.com', icon_url: '',
    scopes: ['User.Read', 'Mail.Read', 'Files.Read'],
    is_verified: true, privacy_url: 'https://brex.com/privacy',
    external_domain: true, user_count: 43,
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
  // ── Suspicious / Unknown ──────────────────────────────────────────────────
  {
    source: 'microsoft', app_id: 'unknown-oauth-7g3k-demo',
    app_name: 'unknown_oauth_app_7g3k', app_description: '', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['Directory.ReadWrite.All', 'Mail.ReadWrite', 'Files.ReadWrite.All', 'User.ReadWrite.All', 'Group.ReadWrite.All'],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 1,
  },
  {
    source: 'google', app_id: 'biz-insights-ai-demo',
    app_name: 'BizInsights AI', app_description: '', developer: '',
    developer_url: '', icon_url: '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    ],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 2,
  },
  {
    source: 'slack', app_id: 'dataexport-bot-demo',
    app_name: 'DataExport Bot', app_description: '', developer: '',
    developer_url: '', icon_url: '',
    scopes: ['channels:history', 'im:history', 'mpim:history', 'groups:history', 'files:read', 'users:read.email', 'team:read'],
    is_verified: false, privacy_url: null,
    external_domain: true, user_count: 1,
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
