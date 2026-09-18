'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApprovalRequest = sequelize.define('ApprovalRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id: { type: DataTypes.UUID, allowNull: false },
  app_name: { type: DataTypes.STRING(255), allowNull: false },
  app_url: { type: DataTypes.STRING(500), allowNull: true },
  app_description: { type: DataTypes.TEXT, allowNull: true },
  requester_name: { type: DataTypes.STRING(255), allowNull: false },
  requester_email: { type: DataTypes.STRING(255), allowNull: false },
  business_justification: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  reviewed_by: { type: DataTypes.STRING(255), allowNull: true },
  review_reason: { type: DataTypes.TEXT, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'approval_requests',
  underscored: true,
  indexes: [
    { fields: ['workspace_id'] },
    { fields: ['workspace_id', 'status'] },
    { fields: ['requester_email'] },
  ],
});

module.exports = ApprovalRequest;
