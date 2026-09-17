'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  inviter_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'viewer'), defaultValue: 'viewer' },
  status: { type: DataTypes.ENUM('pending', 'active', 'revoked'), defaultValue: 'pending' },
  invited_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  accepted_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'team_members',
  underscored: true,
  indexes: [{ fields: ['workspace_id', 'email'], unique: true }],
});

module.exports = TeamMember;
