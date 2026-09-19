'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScanRun = sequelize.define('ScanRun', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  triggered_by: { type: DataTypes.ENUM('manual', 'scheduled', 'cli'), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'), defaultValue: 'pending' },
  source: { type: DataTypes.ENUM('slack', 'google', 'microsoft', 'okta', 'github', 'jira', 'confluence', 'extension', 'both'), allowNull: false },
  apps_found: { type: DataTypes.INTEGER, allowNull: true },
  critical_count: { type: DataTypes.INTEGER, allowNull: true },
  high_count: { type: DataTypes.INTEGER, allowNull: true },
  medium_count: { type: DataTypes.INTEGER, allowNull: true },
  low_count: { type: DataTypes.INTEGER, allowNull: true },
  error_message: { type: DataTypes.TEXT, allowNull: true },
  started_at: { type: DataTypes.DATE, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'scan_runs',
  underscored: true,
});

module.exports = ScanRun;
