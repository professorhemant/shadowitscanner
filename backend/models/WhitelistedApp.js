'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhitelistedApp = sequelize.define('WhitelistedApp', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  app_id: { type: DataTypes.STRING(255), allowNull: false },
  source: { type: DataTypes.ENUM('slack', 'google', 'microsoft', 'okta'), allowNull: false },
  approved_by: { type: DataTypes.UUID, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  approved_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expires_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'whitelisted_apps',
  underscored: true,
  indexes: [{ fields: ['workspace_id', 'app_id', 'source'], unique: true }],
});

module.exports = WhitelistedApp;
