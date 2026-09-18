'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiKey = sequelize.define('ApiKey', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  key_prefix: { type: DataTypes.STRING(16), allowNull: false },
  key_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  permissions: { type: DataTypes.JSONB, defaultValue: ['read:apps', 'read:scans', 'read:analytics'] },
  last_used_at: { type: DataTypes.DATE, allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'api_keys',
  underscored: true,
});

module.exports = ApiKey;
