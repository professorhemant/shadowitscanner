'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NudgeLog = sequelize.define('NudgeLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  app_id: { type: DataTypes.STRING(255), allowNull: false },
  app_name: { type: DataTypes.STRING(255), allowNull: false },
  source: { type: DataTypes.STRING(50), allowNull: true },
  risk_level: { type: DataTypes.STRING(20), allowNull: false },
  risk_score: { type: DataTypes.INTEGER, allowNull: false },
  user_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  recipients: { type: DataTypes.JSONB, defaultValue: [] },
  nudge_type: { type: DataTypes.ENUM('auto', 'manual'), defaultValue: 'manual' },
  sent_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'nudge_logs',
  underscored: true,
  indexes: [
    { fields: ['workspace_id'] },
    { fields: ['app_id', 'workspace_id'] },
  ],
});

module.exports = NudgeLog;
