'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash: { type: DataTypes.TEXT, allowNull: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  google_id: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  plan: { type: DataTypes.ENUM('free', 'pro', 'enterprise'), defaultValue: 'free', allowNull: false },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
}, {
  tableName: 'users',
  underscored: true,
});

module.exports = User;
