'use strict';

const sequelize = require('../config/database');
const User = require('./User');
const Workspace = require('./Workspace');
const ScanRun = require('./ScanRun');
const DiscoveredApp = require('./DiscoveredApp');
const WhitelistedApp = require('./WhitelistedApp');
const AlertConfig = require('./AlertConfig');
const TeamMember = require('./TeamMember');

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

    // WhitelistedApp source enum
    try {
      await sequelize.query(`ALTER TYPE "enum_whitelisted_apps_source" ADD VALUE IF NOT EXISTS 'microsoft'`);
      await sequelize.query(`ALTER TYPE "enum_whitelisted_apps_source" ADD VALUE IF NOT EXISTS 'okta'`);
      console.log('Migration: updated whitelisted_apps.source enum');
    } catch (e) { /* already exists */ }
  }

  console.log('Migrations complete');
}

async function syncDB() {
  await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  await runMigrations();
  console.log('Database synced');
}

module.exports = { sequelize, syncDB, User, Workspace, ScanRun, DiscoveredApp, WhitelistedApp, AlertConfig, TeamMember };
