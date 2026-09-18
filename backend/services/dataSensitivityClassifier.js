'use strict';

// Scope patterns per data category
const SCOPE_PATTERNS = {
  email_content: {
    label: 'Email Content',
    icon: '✉️',
    description: 'Can read or send emails on behalf of users',
    sensitivity: 'critical',
    scopes: new Set([
      // Google
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.send',
      // Microsoft
      'Mail.Read', 'Mail.ReadWrite', 'Mail.Send', 'Mail.ReadBasic', 'MailboxSettings.ReadWrite',
      // Slack
      'im:history', 'mpim:history',
    ]),
  },
  files_documents: {
    label: 'Files & Documents',
    icon: '📄',
    description: 'Can read or write files, spreadsheets, and documents',
    sensitivity: 'high',
    scopes: new Set([
      // Google
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/presentations',
      // Microsoft
      'Files.Read', 'Files.ReadWrite', 'Files.Read.All', 'Files.ReadWrite.All',
      'Sites.Read.All', 'Sites.ReadWrite.All',
      // Slack
      'files:read', 'files:write',
    ]),
  },
  calendar_meetings: {
    label: 'Calendar & Meetings',
    icon: '📅',
    description: 'Can read calendar events, meeting attendees, and schedules',
    sensitivity: 'medium',
    scopes: new Set([
      // Google
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      // Microsoft
      'Calendars.Read', 'Calendars.ReadWrite', 'Calendars.ReadBasic',
    ]),
  },
  contacts_people: {
    label: 'Contacts & Directory',
    icon: '👥',
    description: 'Can access employee directory, contacts, and user profiles',
    sensitivity: 'medium',
    scopes: new Set([
      // Google
      'https://www.googleapis.com/auth/contacts',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/directory.readonly',
      // Microsoft
      'Contacts.Read', 'Contacts.ReadWrite', 'People.Read',
      'User.Read.All', 'User.ReadBasic.All',
      // Slack
      'users:read', 'users:read.email', 'users.profile:read',
    ]),
  },
  chat_messages: {
    label: 'Chat & Messages',
    icon: '💬',
    description: 'Can read internal chat messages and channel history',
    sensitivity: 'high',
    scopes: new Set([
      // Slack
      'channels:history', 'groups:history', 'im:history', 'mpim:history', 'search:read',
      // Microsoft
      'Chat.Read', 'Chat.ReadWrite', 'ChannelMessage.Read.All',
    ]),
  },
  workspace_admin: {
    label: 'Workspace Admin',
    icon: '🔑',
    description: 'Has admin-level access to manage users, apps, or org settings',
    sensitivity: 'critical',
    scopes: new Set([
      // Slack
      'admin', 'admin.apps:write', 'admin.users:write', 'admin.conversations:write',
      // Google
      'https://www.googleapis.com/auth/admin.directory.user',
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/iam',
      // Microsoft
      'Directory.ReadWrite.All', 'User.ReadWrite.All', 'RoleManagement.ReadWrite.Directory',
      'Application.ReadWrite.All', 'Organization.ReadWrite.All',
      // Okta
      'USER_PROVISIONING', 'PUSH_NEW_USERS', 'PUSH_USER_DEACTIVATION',
    ]),
  },
  audit_logs: {
    label: 'Audit Logs & Reports',
    icon: '📊',
    description: 'Can read security audit logs and admin reports',
    sensitivity: 'high',
    scopes: new Set([
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'AuditLog.Read.All',
    ]),
  },
};

// App name / developer patterns → additional data categories
const APP_CATEGORY_MAP = [
  {
    category: 'source_code',
    label: 'Source Code',
    icon: '💻',
    description: 'Has access to code repositories and development artifacts',
    sensitivity: 'high',
    patterns: [/github/i, /gitlab/i, /bitbucket/i, /gitea/i, /azure devops/i, /sourcegraph/i, /replit/i],
  },
  {
    category: 'hr_personnel',
    label: 'HR & Personnel Data',
    icon: '🧑‍💼',
    description: 'Handles employee records, payroll, or HR information',
    sensitivity: 'critical',
    patterns: [/workday/i, /rippling/i, /bamboo/i, /gusto/i, /adp/i, /namely/i, /greenhouse/i, /lever/i, /workable/i, /lattice/i, /15five/i, /personio/i],
  },
  {
    category: 'financial',
    label: 'Financial Records',
    icon: '💳',
    description: 'Processes expenses, payments, or financial data',
    sensitivity: 'critical',
    patterns: [/expensify/i, /ramp/i, /brex/i, /mercury/i, /quickbooks/i, /xero/i, /stripe/i, /bill\.com/i, /divvy/i, /concur/i, /netsuite/i, /sap/i, /sage/i],
  },
  {
    category: 'customer_data',
    label: 'Customer Data',
    icon: '🤝',
    description: 'Stores or processes customer records, sales data, or CRM data',
    sensitivity: 'high',
    patterns: [/salesforce/i, /hubspot/i, /pipedrive/i, /close\.com/i, /close crm/i, /zoho/i, /zendesk/i, /intercom/i, /freshdesk/i, /outreach/i, /apollo/i, /gong/i, /chorus/i],
  },
  {
    category: 'identity_provisioning',
    label: 'Identity & Provisioning',
    icon: '🪪',
    description: 'Controls user identity, SSO, or account provisioning',
    sensitivity: 'critical',
    patterns: [/okta/i, /auth0/i, /onelogin/i, /jumpcloud/i, /ping identity/i, /cyberark/i, /sailpoint/i, /saviynt/i],
  },
  {
    category: 'cloud_infra',
    label: 'Cloud Infrastructure',
    icon: '☁️',
    description: 'Has access to cloud resources, databases, or infrastructure',
    sensitivity: 'critical',
    patterns: [/aws/i, /amazon web services/i, /google cloud/i, /azure/i, /digitalocean/i, /linode/i, /heroku/i, /cloudflare/i],
  },
];

const SENSITIVITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };

function classifyApp(app) {
  const scopes = Array.isArray(app.scopes) ? app.scopes : [];
  const appName = app.app_name || '';
  const developer = app.developer || '';
  const combined = (appName + ' ' + developer).toLowerCase();

  const exposedCategories = [];
  let maxSensitivity = 'low';

  // Scope-based detection
  for (const [key, cat] of Object.entries(SCOPE_PATTERNS)) {
    const hit = scopes.some(s => cat.scopes.has(s));
    if (hit) {
      exposedCategories.push({ key, label: cat.label, icon: cat.icon, description: cat.description, sensitivity: cat.sensitivity, via: 'scope' });
      if (SENSITIVITY_ORDER[cat.sensitivity] > SENSITIVITY_ORDER[maxSensitivity]) maxSensitivity = cat.sensitivity;
    }
  }

  // Stored boolean flags for apps where individual scopes weren't enumerated
  if (app.accesses_email && !exposedCategories.find(c => c.key === 'email_content')) {
    exposedCategories.push({ key: 'email_content', label: 'Email Content', icon: '✉️', description: 'Can access email', sensitivity: 'critical', via: 'flag' });
    if (SENSITIVITY_ORDER['critical'] > SENSITIVITY_ORDER[maxSensitivity]) maxSensitivity = 'critical';
  }
  if (app.accesses_drive && !exposedCategories.find(c => c.key === 'files_documents')) {
    exposedCategories.push({ key: 'files_documents', label: 'Files & Documents', icon: '📄', description: 'Can access files', sensitivity: 'high', via: 'flag' });
    if (SENSITIVITY_ORDER['high'] > SENSITIVITY_ORDER[maxSensitivity]) maxSensitivity = maxSensitivity === 'critical' ? 'critical' : 'high';
  }
  if (app.accesses_calendar && !exposedCategories.find(c => c.key === 'calendar_meetings')) {
    exposedCategories.push({ key: 'calendar_meetings', label: 'Calendar & Meetings', icon: '📅', description: 'Can access calendar', sensitivity: 'medium', via: 'flag' });
    if (SENSITIVITY_ORDER['medium'] > SENSITIVITY_ORDER[maxSensitivity]) maxSensitivity = maxSensitivity === 'critical' || maxSensitivity === 'high' ? maxSensitivity : 'medium';
  }
  if (app.has_admin_scope && !exposedCategories.find(c => c.key === 'workspace_admin')) {
    exposedCategories.push({ key: 'workspace_admin', label: 'Workspace Admin', icon: '🔑', description: 'Has admin-level access', sensitivity: 'critical', via: 'flag' });
    maxSensitivity = 'critical';
  }

  // App name / developer pattern matching
  for (const cat of APP_CATEGORY_MAP) {
    const matches = cat.patterns.some(p => p.test(combined));
    if (matches && !exposedCategories.find(c => c.key === cat.category)) {
      exposedCategories.push({ key: cat.category, label: cat.label, icon: cat.icon, description: cat.description, sensitivity: cat.sensitivity, via: 'name' });
      if (SENSITIVITY_ORDER[cat.sensitivity] > SENSITIVITY_ORDER[maxSensitivity]) maxSensitivity = cat.sensitivity;
    }
  }

  // AI amplification: if an AI tool has any data access, escalate to critical
  const amplified_by_ai = app.is_ai_tool && exposedCategories.length > 0;
  if (amplified_by_ai && maxSensitivity !== 'critical') maxSensitivity = 'critical';

  return {
    sensitivity_level: exposedCategories.length === 0 ? 'low' : maxSensitivity,
    exposure_count: exposedCategories.length,
    exposures: exposedCategories,
    amplified_by_ai,
  };
}

module.exports = { classifyApp };
