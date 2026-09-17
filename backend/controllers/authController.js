'use strict';

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken } = require('../services/tokenService');

async function register(req, res) {
  return res.status(403).json({ message: 'Registration is closed. Contact the administrator.' });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password_hash) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } });
  } catch (err) { next(err); }
}

async function me(req, res) {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, plan: req.user.plan } });
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ message: 'Both fields are required' });
    if (new_password.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });

    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password_hash = await bcrypt.hash(new_password, 12);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
}

module.exports = { register, login, me, changePassword };
