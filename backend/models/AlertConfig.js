'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertConfig = sequelize.define('AlertConfig', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  min_risk_level: { type: DataTypes.ENUM('critical', 'high', 'medium', 'low'), defaultValue: 'high' },
  email_recipients: { type: DataTypes.JSONB, defaultValue: [] },
  notify_on_new: { type: DataTypes.BOOLEAN, defaultValue: true },
  notify_on_score_change: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'alert_configs',
  underscored: true,
});

module.exports = AlertConfig;
