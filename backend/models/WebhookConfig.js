'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { encrypt, decrypt } = require('../utils/crypto');

const WebhookConfig = sequelize.define('WebhookConfig', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  url: { type: DataTypes.TEXT, allowNull: false },
  secret: {
    type: DataTypes.TEXT, allowNull: true,
    get() { return decrypt(this.getDataValue('secret')); },
    set(v) { this.setDataValue('secret', encrypt(v)); },
  },
  events: { type: DataTypes.JSONB, defaultValue: ['app.critical', 'app.high'] },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'webhook_configs',
  underscored: true,
});

module.exports = WebhookConfig;
