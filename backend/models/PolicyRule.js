'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PolicyRule = sequelize.define('PolicyRule', {
  id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  workspace_id:     { type: DataTypes.UUID, allowNull: false },
  name:             { type: DataTypes.STRING(255), allowNull: false },
  condition_type:   {
    type: DataTypes.ENUM(
      'app_name_contains', 'developer_contains', 'has_scope_containing',
      'is_ai_tool', 'has_admin_scope', 'accesses_email', 'accesses_drive',
      'has_external_domain', 'risk_score_gte', 'source_equals', 'user_count_gte'
    ),
    allowNull: false,
  },
  condition_value:  { type: DataTypes.STRING(255), allowNull: true },
  action_type:      { type: DataTypes.ENUM('set_level', 'escalate_level', 'add_score'), allowNull: false },
  action_value:     { type: DataTypes.STRING(32), allowNull: false },
  enabled:          { type: DataTypes.BOOLEAN, defaultValue: true },
  priority:         { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'policy_rules',
  underscored: true,
  indexes: [{ fields: ['workspace_id', 'enabled'] }],
});

module.exports = PolicyRule;
