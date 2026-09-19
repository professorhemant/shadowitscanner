'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');

const DEMO_EMAIL = 'demo@shadowit.app';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const DEMO_ALLOWED_URLS = ['/api/scans/trigger'];

function demoGuard(req, res, next) {
  if (req.user?.email === DEMO_EMAIL && !SAFE_METHODS.has(req.method)) {
    if (DEMO_ALLOWED_URLS.some(u => req.originalUrl?.includes(u))) return next();
    return res.status(403).json({
      message: 'This is a read-only demo. Sign up free to make changes to real data.',
      demo_readonly: true,
    });
  }
  next();
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const token = header.slice(7);

  // API key path: tokens starting with "sit_"
  if (token.startsWith('sit_')) {
    try {
      const { ApiKey } = require('../models');
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const apiKey = await ApiKey.findOne({ where: { key_hash: hash, is_active: true } });
      if (!apiKey) return res.status(401).json({ message: 'Invalid API key' });
      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
        return res.status(401).json({ message: 'API key expired' });
      }
      const user = await User.findByPk(apiKey.user_id, { attributes: { exclude: ['password_hash'] } });
      if (!user) return res.status(401).json({ message: 'User not found' });
      apiKey.update({ last_used_at: new Date() }).catch(() => {});
      req.user = user;
      req.apiKey = apiKey;
      demoGuard(req, res, next);
      return;
    } catch {
      return res.status(401).json({ message: 'API key error' });
    }
  }

  // JWT path
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub, { attributes: { exclude: ['password_hash'] } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    demoGuard(req, res, next);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
