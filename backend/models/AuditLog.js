'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: true },
  actor_name: { type: DataTypes.STRING(255), allowNull: true },
  actor_email: { type: DataTypes.STRING(255), allowNull: true },
  action: { type: DataTypes.STRING(64), allowNull: false },
  resource_type: { type: DataTypes.STRING(64), allowNull: true },
  resource_id: { type: DataTypes.STRING(255), allowNull: true },
  resource_name: { type: DataTypes.STRING(255), allowNull: true },
  meta: { type: DataTypes.JSONB, defaultValue: {} },
  ip_address: { type: DataTypes.STRING(64), allowNull: true },
}, { tableName: 'audit_logs', underscored: true });

module.exports = AuditLog;
