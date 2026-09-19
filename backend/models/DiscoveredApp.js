'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiscoveredApp = sequelize.define('DiscoveredApp', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  scan_run_id: { type: DataTypes.UUID, allowNull: false },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  source: { type: DataTypes.ENUM('slack', 'google', 'microsoft', 'okta', 'github', 'jira', 'confluence'), allowNull: false },
  app_id: { type: DataTypes.STRING(255), allowNull: false },
  app_name: { type: DataTypes.STRING(255), allowNull: false },
  app_description: { type: DataTypes.TEXT, allowNull: true },
  developer: { type: DataTypes.STRING(255), allowNull: true },
  developer_url: { type: DataTypes.STRING(512), allowNull: true },
  icon_url: { type: DataTypes.STRING(512), allowNull: true },
  scopes: { type: DataTypes.JSONB, defaultValue: [] },
  raw_data: { type: DataTypes.JSONB, defaultValue: {} },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  risk_score: { type: DataTypes.INTEGER, allowNull: false },
  risk_level: { type: DataTypes.ENUM('critical', 'high', 'medium', 'low'), allowNull: false },
  risk_factors: { type: DataTypes.JSONB, defaultValue: [] },
  has_admin_scope: { type: DataTypes.BOOLEAN, defaultValue: false },
  has_write_scope: { type: DataTypes.BOOLEAN, defaultValue: false },
  accesses_email: { type: DataTypes.BOOLEAN, defaultValue: false },
  accesses_calendar: { type: DataTypes.BOOLEAN, defaultValue: false },
  accesses_drive: { type: DataTypes.BOOLEAN, defaultValue: false },
  external_domain: { type: DataTypes.BOOLEAN, defaultValue: false },
  user_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_ai_tool: { type: DataTypes.BOOLEAN, defaultValue: false },
  ai_risk_flags: { type: DataTypes.JSONB, defaultValue: null },
  first_seen_at: { type: DataTypes.DATE, allowNull: false },
  last_seen_at: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'discovered_apps',
  underscored: true,
  indexes: [
    { fields: ['workspace_id', 'source'] },
    { fields: ['workspace_id', 'risk_level'] },
    { fields: ['scan_run_id'] },
    { fields: ['workspace_id', 'app_id', 'source'], unique: true, name: 'discovered_apps_workspace_app_source_unique' },
  ],
});

module.exports = DiscoveredApp;
