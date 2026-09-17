'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { encrypt, decrypt } = require('../utils/crypto');

const Workspace = sequelize.define('Workspace', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('slack', 'google'), allowNull: false },
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
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_scan_at: { type: DataTypes.DATE, allowNull: true },
  schedule: { type: DataTypes.STRING(50), allowNull: true }, // cron expression
}, {
  tableName: 'workspaces',
  underscored: true,
});

module.exports = Workspace;
