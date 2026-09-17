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

async function syncDB() {
  await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  console.log('Database synced');
}

module.exports = { sequelize, syncDB, User, Workspace, ScanRun, DiscoveredApp, WhitelistedApp, AlertConfig, TeamMember };
