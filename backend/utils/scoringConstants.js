'use strict';

const RISK_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const RISK_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 40,
};

// Slack OAuth scope weight table
const SLACK_SCOPE_WEIGHTS = {
  // Super-admin / workspace admin
  'admin': 40,
  'admin.apps:read': 30,
  'admin.apps:write': 40,
  'admin.conversations:write': 35,
  'admin.users:write': 40,
  'admin.teams:read': 25,
  'admin.usergroups:write': 30,

  // Write to core data
  'chat:write': 22,
  'chat:write.public': 25,
  'chat:write.customize': 20,
  'files:write': 22,
  'channels:write': 20,
  'groups:write': 20,
  'im:write': 18,
  'pins:write': 12,
  'reactions:write': 10,
  'bookmarks:write': 10,
  'usergroups:write': 18,

  // Read sensitive data
  'channels:history': 15,
  'groups:history': 15,
  'im:history': 18,
  'mpim:history': 18,
  'files:read': 14,
  'users:read': 12,
  'users:read.email': 18,
  'email': 18,
  'identity.email': 18,
  'identity.basic': 10,

  // Read metadata (low risk)
  'channels:read': 6,
  'groups:read': 6,
  'im:read': 6,
  'mpim:read': 6,
  'users.profile:read': 8,
  'team:read': 5,
  'emoji:read': 2,
  'reactions:read': 2,
  'pins:read': 2,
  'bookmarks:read': 2,
  'search:read': 10,
  'links:read': 5,
  'links:write': 8,
  'workflows:read': 8,
  'workflows:steps:execute': 15,
  'commands': 5,
  'incoming-webhook': 12,
};

// Microsoft Graph delegated permission weight table
const MICROSOFT_SCOPE_WEIGHTS = {
  // Admin / directory
  'Directory.ReadWrite.All': 40,
  'Directory.Read.All': 30,
  'RoleManagement.ReadWrite.Directory': 40,
  'User.ReadWrite.All': 38,
  'Group.ReadWrite.All': 35,
  'Organization.ReadWrite.All': 38,
  'Application.ReadWrite.All': 40,
  'Policy.ReadWrite.All': 35,
  'AuditLog.Read.All': 28,

  // Mail
  'Mail.ReadWrite': 28,
  'Mail.Send': 25,
  'Mail.Read': 20,
  'Mail.ReadBasic': 14,
  'MailboxSettings.ReadWrite': 20,

  // Calendar
  'Calendars.ReadWrite': 22,
  'Calendars.Read': 14,
  'Calendars.ReadBasic': 8,

  // Files / SharePoint
  'Files.ReadWrite.All': 32,
  'Files.ReadWrite': 24,
  'Files.Read.All': 18,
  'Files.Read': 12,
  'Sites.ReadWrite.All': 32,
  'Sites.Read.All': 18,

  // Teams / Chat
  'Chat.ReadWrite': 22,
  'Chat.Read': 14,
  'ChannelMessage.Read.All': 14,
  'ChannelMessage.Send': 16,
  'Team.ReadBasic.All': 8,
  'TeamSettings.ReadWrite.All': 28,

  // Contacts / People
  'Contacts.ReadWrite': 16,
  'Contacts.Read': 10,
  'People.Read': 8,

  // Identity
  'User.Read': 5,
  'User.ReadBasic.All': 8,
  'User.Read.All': 18,
  'openid': 3,
  'profile': 3,
  'email': 8,
  'offline_access': 4,
};

// Google OAuth scope weight table
const GOOGLE_SCOPE_WEIGHTS = {
  // Super-admin
  'https://www.googleapis.com/auth/admin.directory.user': 40,
  'https://www.googleapis.com/auth/admin.directory.group': 35,
  'https://www.googleapis.com/auth/admin.directory.orgunit': 35,
  'https://www.googleapis.com/auth/admin.reports.audit.readonly': 30,
  'https://www.googleapis.com/auth/cloud-platform': 40,
  'https://www.googleapis.com/auth/iam': 40,

  // Drive full access
  'https://www.googleapis.com/auth/drive': 30,
  'https://www.googleapis.com/auth/drive.file': 20,
  'https://www.googleapis.com/auth/drive.appdata': 12,
  'https://www.googleapis.com/auth/drive.metadata': 10,
  'https://www.googleapis.com/auth/drive.readonly': 14,
  'https://www.googleapis.com/auth/drive.metadata.readonly': 8,
  'https://www.googleapis.com/auth/spreadsheets': 22,
  'https://www.googleapis.com/auth/documents': 22,
  'https://www.googleapis.com/auth/presentations': 18,

  // Gmail
  'https://www.googleapis.com/auth/gmail.readonly': 18,
  'https://www.googleapis.com/auth/gmail.send': 22,
  'https://www.googleapis.com/auth/gmail.modify': 25,
  'https://mail.google.com/': 30,
  'https://www.googleapis.com/auth/gmail.compose': 18,
  'https://www.googleapis.com/auth/gmail.labels': 10,

  // Calendar
  'https://www.googleapis.com/auth/calendar': 20,
  'https://www.googleapis.com/auth/calendar.events': 18,
  'https://www.googleapis.com/auth/calendar.readonly': 12,

  // People / Contacts
  'https://www.googleapis.com/auth/contacts': 15,
  'https://www.googleapis.com/auth/contacts.readonly': 10,
  'https://www.googleapis.com/auth/directory.readonly': 12,
  'https://www.googleapis.com/auth/profile': 8,
  'https://www.googleapis.com/auth/userinfo.email': 8,
  'https://www.googleapis.com/auth/userinfo.profile': 5,
  'openid': 3,
};

// Scopes that indicate email access
const EMAIL_SCOPES = new Set([
  // Slack
  'users:read.email', 'identity.email', 'email',
  // Google
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://mail.google.com/',
  // Microsoft
  'Mail.Read', 'Mail.ReadWrite', 'Mail.Send', 'Mail.ReadBasic', 'MailboxSettings.ReadWrite',
]);

// Scopes that indicate calendar access
const CALENDAR_SCOPES = new Set([
  // Google
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  // Microsoft
  'Calendars.Read', 'Calendars.ReadWrite', 'Calendars.ReadBasic',
]);

// Scopes that indicate Drive/file access
const DRIVE_SCOPES = new Set([
  // Slack
  'files:read', 'files:write',
  // Google
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  // Microsoft
  'Files.Read', 'Files.ReadWrite', 'Files.Read.All', 'Files.ReadWrite.All',
  'Sites.Read.All', 'Sites.ReadWrite.All',
]);

// Scopes that indicate admin access
const ADMIN_SCOPES = new Set([
  // Slack
  'admin', 'admin.apps:write', 'admin.users:write',
  // Google
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.group',
  'https://www.googleapis.com/auth/cloud-platform',
  // Microsoft
  'Directory.ReadWrite.All', 'User.ReadWrite.All', 'RoleManagement.ReadWrite.Directory',
  'Application.ReadWrite.All', 'Organization.ReadWrite.All',
]);

// Scopes that indicate write access
const WRITE_SCOPES = new Set([
  // Slack
  'chat:write', 'chat:write.public', 'files:write', 'channels:write',
  'groups:write', 'im:write', 'pins:write',
  // Google
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  // Microsoft
  'Mail.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite',
  'Files.ReadWrite', 'Files.ReadWrite.All', 'Sites.ReadWrite.All',
  'Chat.ReadWrite', 'ChannelMessage.Send',
]);

function getRiskLevel(score) {
  if (score >= RISK_THRESHOLDS.CRITICAL) return RISK_LEVELS.CRITICAL;
  if (score >= RISK_THRESHOLDS.HIGH) return RISK_LEVELS.HIGH;
  if (score >= RISK_THRESHOLDS.MEDIUM) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

module.exports = {
  RISK_LEVELS,
  RISK_THRESHOLDS,
  SLACK_SCOPE_WEIGHTS,
  GOOGLE_SCOPE_WEIGHTS,
  MICROSOFT_SCOPE_WEIGHTS,
  EMAIL_SCOPES,
  CALENDAR_SCOPES,
  DRIVE_SCOPES,
  ADMIN_SCOPES,
  WRITE_SCOPES,
  getRiskLevel,
};
