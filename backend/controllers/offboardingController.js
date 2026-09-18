'use strict';

const { Workspace, DiscoveredApp } = require('../models');

// Per-source revocation instructions
const SOURCE_REVOKE = {
  slack:     'Slack Admin Console → Settings & administration → Manage apps → Revoke access',
  google:    'Google Admin Console → Security → API Controls → Manage Third-Party App Access → Select app → Remove Access',
  microsoft: 'Azure Portal → Azure Active Directory → Enterprise applications → Select app → Users and groups → Remove user',
  okta:      'Okta Admin Console → Applications → Select app → Assignments tab → Remove user assignment',
  github:    'GitHub Org Settings → OAuth Apps or Installed GitHub Apps → Revoke / Remove access',
  jira:      'Atlassian Admin → Connected apps → Select app → Manage access → Remove user',
};

// Per-app-name specific revocation notes (overrides source note when matched)
const APP_REVOKE_NOTES = {
  'notion':       'Notion Settings → Members → Remove member; also check workspace integrations',
  'chatgpt':      'OpenAI account → Integrations → Revoke connection; or via Google Workspace admin',
  'grammarly':    'Google Admin → Security → Third-party OAuth Apps → Grammarly → Remove access',
  'github copilot': 'GitHub Org → Settings → GitHub Copilot → Manage access → Remove user seat',
  'slack':        'Workspace Admin → Deactivate user account (automatically revokes all app access)',
  'zoom':         'Zoom Admin → User Management → Deactivate user; revoke SSO if applicable',
  'dropbox':      'Dropbox Admin Console → Members → Remove member; revoke Business account',
  'hubspot':      'HubSpot Settings → Users & Teams → Remove user',
  'salesforce':   'Salesforce Setup → Users → Deactivate user; check Connected Apps',
  'zendesk':      'Zendesk Admin → Manage → People → Suspend agent account',
  'figma':        'Figma Admin → Members → Remove from all teams and organization',
  'linear':       'Linear Settings → Members → Remove member',
  'notion ai':    'Notion Settings → Members → Remove; AI access removed automatically',
  'monday':       'Monday.com Admin → Account → Team Management → Remove user',
  'airtable':     'Airtable Account Settings → Workspace Members → Remove collaborator',
  'trello':       'Trello Workspace Settings → Members → Remove member from all boards',
  'jira':         'Atlassian Admin → User management → Deactivate user (revokes all Atlassian apps)',
  'confluence':   'Atlassian Admin → User management → Deactivate user',
  'github':       'GitHub Org → People → Remove member; revoke all Personal Access Tokens',
  'lastpass':     'LastPass Admin Console → People → Remove user; reset/transfer vaults',
  '1password':    '1Password Teams → People → Suspend user; recover vault',
  'okta':         'Okta Admin → Directory → People → Deactivate user',
  'docusign':     'DocuSign Admin → Users → Close/Transfer account',
  'adobe':        'Adobe Admin Console → Users → Remove product profiles and remove user',
};

function getRevokeNote(appName, source) {
  const nameLower = (appName || '').toLowerCase();
  for (const [key, note] of Object.entries(APP_REVOKE_NOTES)) {
    if (nameLower.includes(key)) return note;
  }
  return SOURCE_REVOKE[source] || 'Contact app admin to revoke user access and any stored tokens';
}

function searchRawData(raw, email) {
  if (!raw || !email) return false;
  const str = JSON.stringify(raw).toLowerCase();
  return str.includes(email.toLowerCase());
}

async function getChecklist(req, res, next) {
  try {
    const { workspace_id, email } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id is required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const apps = await DiscoveredApp.findAll({
      where: { workspace_id },
      order: [['risk_score', 'DESC']],
      limit: 500,
    });

    // Deduplicate by app_id
    const seen = new Set();
    const unique = [];
    for (const a of apps) {
      if (!seen.has(a.app_id)) { seen.add(a.app_id); unique.push(a); }
    }

    // Search raw_data for email references
    const emailLower = (email || '').toLowerCase().trim();

    const items = unique.map(a => {
      const confirmed = emailLower ? searchRawData(a.raw_data, emailLower) : false;
      return {
        app_id: a.app_id,
        app_name: a.app_name,
        developer: a.developer,
        source: a.source,
        risk_level: a.risk_level,
        risk_score: a.risk_score,
        has_admin_scope: a.has_admin_scope,
        has_write_scope: a.has_write_scope,
        accesses_email: a.accesses_email,
        accesses_calendar: a.accesses_calendar,
        accesses_drive: a.accesses_drive,
        is_ai_tool: a.is_ai_tool,
        user_count: a.user_count,
        scopes: a.scopes,
        confirmed_for_user: confirmed,
        revoke_note: getRevokeNote(a.app_name, a.source),
      };
    });

    // Group into priority buckets
    const admin     = items.filter(a => a.has_admin_scope);
    const emailCal  = items.filter(a => !a.has_admin_scope && (a.accesses_email || a.accesses_calendar || a.accesses_drive));
    const aiTools   = items.filter(a => !a.has_admin_scope && !a.accesses_email && !a.accesses_calendar && !a.accesses_drive && a.is_ai_tool);
    const rest      = items.filter(a => !a.has_admin_scope && !a.accesses_email && !a.accesses_calendar && !a.accesses_drive && !a.is_ai_tool);

    // Sort each bucket: confirmed first, then by risk_score
    const sort = arr => [...arr].sort((a, b) => {
      if (a.confirmed_for_user && !b.confirmed_for_user) return -1;
      if (!a.confirmed_for_user && b.confirmed_for_user) return 1;
      return b.risk_score - a.risk_score;
    });

    res.json({
      workspace: { id: ws.id, name: ws.name },
      employee_email: emailLower || null,
      generated_at: new Date().toISOString(),
      summary: {
        total_apps: items.length,
        admin_scope: admin.length,
        email_calendar_drive: emailCal.length,
        ai_tools: aiTools.length,
        other: rest.length,
        confirmed_count: items.filter(i => i.confirmed_for_user).length,
      },
      sections: [
        { id: 'admin',    label: 'Admin & Write Access',         priority: 'critical', items: sort(admin) },
        { id: 'email',    label: 'Email / Calendar / Drive Access', priority: 'high',  items: sort(emailCal) },
        { id: 'ai',       label: 'AI Tools',                     priority: 'high',     items: sort(aiTools) },
        { id: 'other',    label: 'All Other Apps',               priority: 'medium',   items: sort(rest) },
      ].filter(s => s.items.length > 0),
    });
  } catch (err) { next(err); }
}

module.exports = { getChecklist };
