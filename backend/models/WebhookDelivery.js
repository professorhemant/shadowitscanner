'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WebhookDelivery = sequelize.define('WebhookDelivery', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  webhook_config_id: { type: DataTypes.UUID, allowNull: false },
  event_type: { type: DataTypes.STRING(64), allowNull: false },
  payload: { type: DataTypes.JSONB, defaultValue: {} },
  status: { type: DataTypes.ENUM('success', 'failed', 'pending'), defaultValue: 'pending' },
  response_code: { type: DataTypes.INTEGER, allowNull: true },
  response_body: { type: DataTypes.TEXT, allowNull: true },
  duration_ms: { type: DataTypes.INTEGER, allowNull: true },
  error_message: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'webhook_deliveries',
  underscored: true,
  updatedAt: false,
});

module.exports = WebhookDelivery;
