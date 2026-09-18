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
  const qi = sequelize.getQueryInterface();
  const tableDesc = await qi.describeTable('discovered_apps').catch(() => null);
  if (!tableDesc) return; // table doesn't exist yet — sync will create it with all columns

  if (!tableDesc.is_ai_tool) {
    await qi.addColumn('discovered_apps', 'is_ai_tool', { type: require('sequelize').DataTypes.BOOLEAN, defaultValue: false, allowNull: false });
    console.log('Migration: added is_ai_tool column');
  }
  if (!tableDesc.ai_risk_flags) {
    await qi.addColumn('discovered_apps', 'ai_risk_flags', { type: require('sequelize').DataTypes.JSONB, allowNull: true });
    console.log('Migration: added ai_risk_flags column');
  }
  // Add 'microsoft' to source ENUM if not present
  try {
    await sequelize.query(`ALTER TYPE "enum_discovered_apps_source" ADD VALUE IF NOT EXISTS 'microsoft'`);
    console.log('Migration: added microsoft to source enum');
  } catch (e) {
    // may fail if already exists or on non-postgres — ignore
  }
}

async function syncDB() {
  await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  await runMigrations();
  console.log('Database synced');
}

module.exports = { sequelize, syncDB, User, Workspace, ScanRun, DiscoveredApp, WhitelistedApp, AlertConfig, TeamMember };
