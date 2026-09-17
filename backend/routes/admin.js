'use strict';

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'shadowit-admin-2024';

function guardAdmin(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_SECRET) return res.status(403).json({ message: 'Forbidden' });
  next();
}

// List all user emails
router.get('/users', guardAdmin, async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'name', 'created_at'] });
    res.json(users);
  } catch (err) { next(err); }
});

// Reset password for a user
router.post('/reset-password', guardAdmin, async (req, res, next) => {
  try {
    const { email, new_password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password_hash = await bcrypt.hash(new_password, 12);
    await user.save();
    res.json({ message: 'Password reset', email });
  } catch (err) { next(err); }
});

// Delete a user
router.delete('/users/:email', guardAdmin, async (req, res, next) => {
  try {
    const deleted = await User.destroy({ where: { email: req.params.email } });
    res.json({ message: deleted ? 'Deleted' : 'Not found', deleted });
  } catch (err) { next(err); }
});

module.exports = router;
