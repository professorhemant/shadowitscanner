'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { encrypt, decrypt } = require('../utils/crypto');

const Workspace = sequelize.define('Workspace', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('slack', 'google', 'microsoft', 'okta', 'github', 'jira'), allowNull: false },
  slack_team_id: { type: DataTypes.STRING(128), allowNull: true },
  slack_bot_token: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('slack_bot_token')); },
    set(v) { this.setDataValue('slack_bot_token', encrypt(v)); },
  },
  slack_user_token: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('slack_user_token')); },
    set(v) { this.setDataValue('slack_user_token', encrypt(v)); },
  },
  google_domain: { type: DataTypes.STRING(255), allowNull: true },
  google_service_account: {
    type: DataTypes.TEXT, allowNull: true,
    get() { const v = decrypt(this.getDataValue('google_service_account')); return v ? JSON.parse(v) : null; },
    set(v) { this.setDataValue('google_service_account', encrypt(v ? JSON.stringify(v) : null)); },
  },
  google_admin_email: { type: DataTypes.STRING(255), allowNull: true },
  ms_tenant_id: { type: DataTypes.STRING(255), allowNull: true },
  ms_client_id: { type: DataTypes.STRING(255), allowNull: true },
  ms_client_secret: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('ms_client_secret')); },
    set(v) { this.setDataValue('ms_client_secret', encrypt(v)); },
  },
  okta_domain: { type: DataTypes.STRING(255), allowNull: true },
  okta_api_token: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('okta_api_token')); },
    set(v) { this.setDataValue('okta_api_token', encrypt(v)); },
  },
  github_org: { type: DataTypes.STRING(255), allowNull: true },
  github_pat: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('github_pat')); },
    set(v) { this.setDataValue('github_pat', encrypt(v)); },
  },
  jira_domain: { type: DataTypes.STRING(255), allowNull: true },
  jira_email: { type: DataTypes.STRING(255), allowNull: true },
  jira_api_token: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('jira_api_token')); },
    set(v) { this.setDataValue('jira_api_token', encrypt(v)); },
  },
  slack_digest_webhook: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('slack_digest_webhook')); },
    set(v) { this.setDataValue('slack_digest_webhook', encrypt(v)); },
  },
  slack_digest_channel: { type: DataTypes.STRING(128), allowNull: true },
  slack_digest_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  slack_digest_hour: { type: DataTypes.INTEGER, defaultValue: 9 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_scan_at: { type: DataTypes.DATE, allowNull: true },
  schedule: { type: DataTypes.STRING(50), allowNull: true }, // cron expression
}, {
  tableName: 'workspaces',
  underscored: true,
});

module.exports = Workspace;
