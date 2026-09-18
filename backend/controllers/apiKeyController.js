'use strict';

const crypto = require('crypto');
const { ApiKey, Workspace } = require('../models');

function hashKey(plaintext) {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

async function create(req, res, next) {
  try {
    const { workspace_id, name, permissions, expires_at } = req.body;
    if (!workspace_id || !name) return res.status(400).json({ message: 'workspace_id and name required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    const raw = 'sit_' + crypto.randomBytes(32).toString('hex');
    const prefix = raw.slice(0, 12);
    const hash = hashKey(raw);

    const allowed = ['read:apps', 'read:scans', 'read:analytics', 'read:reports'];
    const perms = Array.isArray(permissions)
      ? permissions.filter(p => allowed.includes(p))
      : allowed.slice(0, 3);

    const key = await ApiKey.create({
      workspace_id,
      user_id: req.user.id,
      name,
      key_prefix: prefix,
      key_hash: hash,
      permissions: perms,
      expires_at: expires_at ? new Date(expires_at) : null,
    });

    res.status(201).json({ key: key.toJSON(), plaintext: raw });
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    const keys = await ApiKey.findAll({
      where: { workspace_id, is_active: true },
      attributes: { exclude: ['key_hash'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ keys });
  } catch (err) { next(err); }
}

async function revoke(req, res, next) {
  try {
    const key = await ApiKey.findByPk(req.params.id);
    if (!key) return res.status(404).json({ message: 'Key not found' });

    const ws = await Workspace.findOne({ where: { id: key.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    await key.update({ is_active: false });
    res.json({ message: 'Key revoked' });
  } catch (err) { next(err); }
}

module.exports = { create, list, revoke, hashKey };
