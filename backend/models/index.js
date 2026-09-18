'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Workspace = require('./Workspace');
const ScanRun = require('./ScanRun');
const DiscoveredApp = require('./DiscoveredApp');
const WhitelistedApp = require('./WhitelistedApp');
const AlertConfig = require('./AlertConfig');
const TeamMember = require('./TeamMember');
const NudgeLog = require('./NudgeLog');
const ApprovalRequest = require('./ApprovalRequest');
const WebhookConfig = require('./WebhookConfig');
const WebhookDelivery = require('./WebhookDelivery');
const PolicyRule = require('./PolicyRule');
const ApiKey = require('./ApiKey');

// Associations
User.hasMany(Workspace, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Workspace.belongsTo(User, { foreignKey: 'user_id' });

Workspace.hasMany(ScanRun, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
ScanRun.belongsTo(Workspace, { foreignKey: 'workspace_id' });

ScanRun.hasMany(DiscoveredApp, { foreignKey: 'scan_run_id', onDelete: 'CASCADE' });
DiscoveredApp.belongsTo(ScanRun, { foreignKey: 'scan_run_id' });

Workspace.hasMany(DiscoveredApp, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
DiscoveredApp.belongsTo(Workspace, { foreignKey: 'workspace_id' });

Workspace.hasMany(WhitelistedApp, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
WhitelistedApp.belongsTo(Workspace, { foreignKey: 'workspace_id' });

Workspace.hasOne(AlertConfig, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
AlertConfig.belongsTo(Workspace, { foreignKey: 'workspace_id' });

Workspace.hasMany(TeamMember, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
TeamMember.belongsTo(Workspace, { foreignKey: 'workspace_id' });

User.hasMany(TeamMember, { foreignKey: 'user_id' });
TeamMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Workspace.hasMany(NudgeLog, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
NudgeLog.belongsTo(Workspace, { foreignKey: 'workspace_id' });

Workspace.hasMany(ApprovalRequest, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
ApprovalRequest.belongsTo(Workspace, { foreignKey: 'workspace_id' });

Workspace.hasMany(WebhookConfig, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
WebhookConfig.belongsTo(Workspace, { foreignKey: 'workspace_id' });

WebhookConfig.hasMany(WebhookDelivery, { foreignKey: 'webhook_config_id', onDelete: 'CASCADE' });
WebhookDelivery.belongsTo(WebhookConfig, { foreignKey: 'webhook_config_id' });

Workspace.hasMany(PolicyRule, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
PolicyRule.belongsTo(Workspace, { foreignKey: 'workspace_id' });

Workspace.hasMany(ApiKey, { foreignKey: 'workspace_id', onDelete: 'CASCADE' });
ApiKey.belongsTo(Workspace, { foreignKey: 'workspace_id' });
User.hasMany(ApiKey, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ApiKey.belongsTo(User, { foreignKey: 'user_id' });

async function runMigrations() {
  const { DataTypes } = require('sequelize');
  const qi = sequelize.getQueryInterface();

  // ── workspaces ──────────────────────────────────────────────────────────
  const wsDesc = await qi.describeTable('workspaces').catch(() => null);
  if (wsDesc) {
    if (!wsDesc.ms_tenant_id) {
      await qi.addColumn('workspaces', 'ms_tenant_id', { type: DataTypes.STRING(255), allowNull: true });
      console.log('Migration: added workspaces.ms_tenant_id');
    }
    if (!wsDesc.ms_client_id) {
      await qi.addColumn('workspaces', 'ms_client_id', { type: DataTypes.STRING(255), allowNull: true });
      console.log('Migration: added workspaces.ms_client_id');
    }
    if (!wsDesc.ms_client_secret) {
      await qi.addColumn('workspaces', 'ms_client_secret', { type: DataTypes.TEXT, allowNull: true });
      console.log('Migration: added workspaces.ms_client_secret');
    }
    if (!wsDesc.okta_domain) {
      await qi.addColumn('workspaces', 'okta_domain', { type: DataTypes.STRING(255), allowNull: true });
      console.log('Migration: added workspaces.okta_domain');
    }
    if (!wsDesc.okta_api_token) {
      await qi.addColumn('workspaces', 'okta_api_token', { type: DataTypes.TEXT, allowNull: true });
      console.log('Migration: added workspaces.okta_api_token');
    }
    try {
      await sequelize.query(`ALTER TYPE "enum_workspaces_type" ADD VALUE IF NOT EXISTS 'microsoft'`);
      console.log('Migration: added microsoft to workspaces.type enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_workspaces_type" ADD VALUE IF NOT EXISTS 'okta'`);
      console.log('Migration: added okta to workspaces.type enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_workspaces_type" ADD VALUE IF NOT EXISTS 'github'`);
      console.log('Migration: added github to workspaces.type enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_workspaces_type" ADD VALUE IF NOT EXISTS 'jira'`);
      console.log('Migration: added jira to workspaces.type enum');
    } catch (e) { /* already exists */ }
    if (!wsDesc.github_org) {
      await qi.addColumn('workspaces', 'github_org', { type: DataTypes.STRING(255), allowNull: true });
      console.log('Migration: added workspaces.github_org');
    }
    if (!wsDesc.github_pat) {
      await qi.addColumn('workspaces', 'github_pat', { type: DataTypes.TEXT, allowNull: true });
      console.log('Migration: added workspaces.github_pat');
    }
    if (!wsDesc.jira_domain) {
      await qi.addColumn('workspaces', 'jira_domain', { type: DataTypes.STRING(255), allowNull: true });
      console.log('Migration: added workspaces.jira_domain');
    }
    if (!wsDesc.jira_email) {
      await qi.addColumn('workspaces', 'jira_email', { type: DataTypes.STRING(255), allowNull: true });
      console.log('Migration: added workspaces.jira_email');
    }
    if (!wsDesc.jira_api_token) {
      await qi.addColumn('workspaces', 'jira_api_token', { type: DataTypes.TEXT, allowNull: true });
      console.log('Migration: added workspaces.jira_api_token');
    }
    if (!wsDesc.slack_digest_webhook) {
      await qi.addColumn('workspaces', 'slack_digest_webhook', { type: DataTypes.TEXT, allowNull: true });
      console.log('Migration: added workspaces.slack_digest_webhook');
    }
    if (!wsDesc.slack_digest_channel) {
      await qi.addColumn('workspaces', 'slack_digest_channel', { type: DataTypes.STRING(128), allowNull: true });
      console.log('Migration: added workspaces.slack_digest_channel');
    }
    if (!wsDesc.slack_digest_enabled) {
      await qi.addColumn('workspaces', 'slack_digest_enabled', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true });
      await sequelize.query(`UPDATE workspaces SET slack_digest_enabled = false WHERE slack_digest_enabled IS NULL`);
      console.log('Migration: added workspaces.slack_digest_enabled');
    }
    if (!wsDesc.slack_digest_hour) {
      await qi.addColumn('workspaces', 'slack_digest_hour', { type: DataTypes.INTEGER, defaultValue: 9, allowNull: true });
      await sequelize.query(`UPDATE workspaces SET slack_digest_hour = 9 WHERE slack_digest_hour IS NULL`);
      console.log('Migration: added workspaces.slack_digest_hour');
    }
    if (!wsDesc.schedule_frequency) {
      await qi.addColumn('workspaces', 'schedule_frequency', { type: DataTypes.STRING(16), defaultValue: 'off', allowNull: true });
      await sequelize.query(`UPDATE workspaces SET schedule_frequency = 'off' WHERE schedule_frequency IS NULL`);
      console.log('Migration: added workspaces.schedule_frequency');
    }
    if (!wsDesc.schedule_hour) {
      await qi.addColumn('workspaces', 'schedule_hour', { type: DataTypes.INTEGER, defaultValue: 9, allowNull: true });
      await sequelize.query(`UPDATE workspaces SET schedule_hour = 9 WHERE schedule_hour IS NULL`);
      console.log('Migration: added workspaces.schedule_hour');
    }
    if (!wsDesc.schedule_day) {
      await qi.addColumn('workspaces', 'schedule_day', { type: DataTypes.INTEGER, defaultValue: 1, allowNull: true });
      await sequelize.query(`UPDATE workspaces SET schedule_day = 1 WHERE schedule_day IS NULL`);
      console.log('Migration: added workspaces.schedule_day');
    }
    if (!wsDesc.schedule_next_run) {
      await qi.addColumn('workspaces', 'schedule_next_run', { type: DataTypes.DATE, allowNull: true });
      console.log('Migration: added workspaces.schedule_next_run');
    }
    if (!wsDesc.schedule_notify_email) {
      await qi.addColumn('workspaces', 'schedule_notify_email', { type: DataTypes.STRING(255), allowNull: true });
      console.log('Migration: added workspaces.schedule_notify_email');
    }
  }

  // ── discovered_apps ──────────────────────────────────────────────────────
  const appsDesc = await qi.describeTable('discovered_apps').catch(() => null);
  if (appsDesc) {
    if (!appsDesc.is_ai_tool) {
      await qi.addColumn('discovered_apps', 'is_ai_tool', { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: true });
      await sequelize.query(`UPDATE discovered_apps SET is_ai_tool = false WHERE is_ai_tool IS NULL`);
      console.log('Migration: added discovered_apps.is_ai_tool');
    }
    if (!appsDesc.ai_risk_flags) {
      await qi.addColumn('discovered_apps', 'ai_risk_flags', { type: DataTypes.JSONB, allowNull: true });
      console.log('Migration: added discovered_apps.ai_risk_flags');
    }
    try {
      await sequelize.query(`ALTER TYPE "enum_discovered_apps_source" ADD VALUE IF NOT EXISTS 'microsoft'`);
      console.log('Migration: added microsoft to discovered_apps.source enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_discovered_apps_source" ADD VALUE IF NOT EXISTS 'okta'`);
      console.log('Migration: added okta to discovered_apps.source enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_discovered_apps_source" ADD VALUE IF NOT EXISTS 'github'`);
      console.log('Migration: added github to discovered_apps.source enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_discovered_apps_source" ADD VALUE IF NOT EXISTS 'jira'`);
      console.log('Migration: added jira to discovered_apps.source enum');
    } catch (e) { /* already exists */ }

    // WhitelistedApp source enum
    try {
      await sequelize.query(`ALTER TYPE "enum_whitelisted_apps_source" ADD VALUE IF NOT EXISTS 'microsoft'`);
      await sequelize.query(`ALTER TYPE "enum_whitelisted_apps_source" ADD VALUE IF NOT EXISTS 'okta'`);
      await sequelize.query(`ALTER TYPE "enum_whitelisted_apps_source" ADD VALUE IF NOT EXISTS 'github'`);
      await sequelize.query(`ALTER TYPE "enum_whitelisted_apps_source" ADD VALUE IF NOT EXISTS 'jira'`);
      console.log('Migration: updated whitelisted_apps.source enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_discovered_apps_source" ADD VALUE IF NOT EXISTS 'extension'`);
      console.log('Migration: added extension to discovered_apps.source enum');
    } catch (e) { /* already exists */ }
    try {
      await sequelize.query(`ALTER TYPE "enum_whitelisted_apps_source" ADD VALUE IF NOT EXISTS 'extension'`);
      console.log('Migration: added extension to whitelisted_apps.source enum');
    } catch (e) { /* already exists */ }
    // scan_runs source + triggered_by enums
    const scanRunSources = ['microsoft', 'okta', 'github', 'jira', 'extension'];
    for (const v of scanRunSources) {
      try {
        await sequelize.query(`ALTER TYPE "enum_scan_runs_source" ADD VALUE IF NOT EXISTS '${v}'`);
      } catch (e) { /* already exists */ }
    }
    try {
      await sequelize.query(`ALTER TYPE "enum_scan_runs_triggered_by" ADD VALUE IF NOT EXISTS 'extension'`);
    } catch (e) { /* already exists */ }
    console.log('Migration: updated scan_runs enums');
  }

  // ── team_members ─────────────────────────────────────────────────────────
  const teamDesc = await qi.describeTable('team_members').catch(() => null);
  if (teamDesc && !teamDesc.invite_token) {
    await qi.addColumn('team_members', 'invite_token', { type: DataTypes.STRING(64), allowNull: true });
    console.log('Migration: added team_members.invite_token');
  }

  // ── nudge_logs ───────────────────────────────────────────────────────────
  const nudgeDesc = await qi.describeTable('nudge_logs').catch(() => null);
  if (!nudgeDesc) {
    await NudgeLog.sync({ force: false });
    console.log('Migration: created nudge_logs table');
  }

  // ── approval_requests ────────────────────────────────────────────────────
  const approvalDesc = await qi.describeTable('approval_requests').catch(() => null);
  if (!approvalDesc) {
    await ApprovalRequest.sync({ force: false });
    console.log('Migration: created approval_requests table');
  }

  // ── webhook_configs ──────────────────────────────────────────────────────
  const webhookDesc = await qi.describeTable('webhook_configs').catch(() => null);
  if (!webhookDesc) {
    await WebhookConfig.sync({ force: false });
    console.log('Migration: created webhook_configs table');
  }

  // ── webhook_deliveries ───────────────────────────────────────────────────
  const deliveryDesc = await qi.describeTable('webhook_deliveries').catch(() => null);
  if (!deliveryDesc) {
    await WebhookDelivery.sync({ force: false });
    console.log('Migration: created webhook_deliveries table');
  }

  // ── policy_rules ─────────────────────────────────────────────────────────
  const policyDesc = await qi.describeTable('policy_rules').catch(() => null);
  if (!policyDesc) {
    await PolicyRule.sync({ force: false });
    console.log('Migration: created policy_rules table');
  }

  // ── api_keys ──────────────────────────────────────────────────────────────
  const apiKeyDesc = await qi.describeTable('api_keys').catch(() => null);
  if (!apiKeyDesc) {
    await ApiKey.sync({ force: false });
    console.log('Migration: created api_keys table');
  }

  console.log('Migrations complete');
}

async function syncDB() {
  await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  await runMigrations();
  console.log('Database synced');
}

module.exports = { sequelize, syncDB, User, Workspace, ScanRun, DiscoveredApp, WhitelistedApp, AlertConfig, TeamMember, NudgeLog, ApprovalRequest, WebhookConfig, WebhookDelivery, PolicyRule, ApiKey };
