'use strict';

const { Op } = require('sequelize');
const { DiscoveredApp, WhitelistedApp, Workspace } = require('../models');

async function list(req, res, next) {
  try {
    const { workspace_id, risk_level, source, search, page = 1, limit = 50, sort = 'risk_score', order = 'DESC' } = req.query;

    // Verify ownership
    if (workspace_id) {
      const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
      if (!ws) return res.status(404).json({ message: 'Workspace not found' });
    }

    const where = {};
    if (workspace_id) where.workspace_id = workspace_id;
    if (risk_level) where.risk_level = risk_level;
    if (source) where.source = source;
    if (search) where.app_name = { [Op.iLike]: `%${search}%` };

    const allowedSort = ['risk_score', 'app_name', 'last_seen_at', 'user_count'];
    const safeSort = allowedSort.includes(sort) ? sort : 'risk_score';
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await DiscoveredApp.findAndCountAll({
      where,
      order: [[safeSort, safeOrder]],
      limit: Math.min(Number(limit), 200),
      offset,
    });

    // Attach whitelist status
    const wlMap = new Set();
    if (workspace_id) {
      const wl = await WhitelistedApp.findAll({ where: { workspace_id } });
      wl.forEach(w => wlMap.add(`${w.app_id}:${w.source}`));
    }

    const apps = rows.map(a => ({
      ...a.toJSON(),
      is_whitelisted: wlMap.has(`${a.app_id}:${a.source}`),
    }));

    res.json({ apps, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function whitelist(req, res, next) {
  try {
    const app = await DiscoveredApp.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found' });

    const ws = await Workspace.findOne({ where: { id: app.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    const { reason } = req.body;
    await WhitelistedApp.upsert({
      workspace_id: app.workspace_id,
      app_id: app.app_id,
      source: app.source,
      approved_by: req.user.id,
      reason: reason || null,
      approved_at: new Date(),
    });
    res.json({ message: 'App whitelisted' });
  } catch (err) { next(err); }
}

async function removeWhitelist(req, res, next) {
  try {
    const app = await DiscoveredApp.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found' });

    const ws = await Workspace.findOne({ where: { id: app.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    await WhitelistedApp.destroy({ where: { workspace_id: app.workspace_id, app_id: app.app_id, source: app.source } });
    res.json({ message: 'Removed from whitelist' });
  } catch (err) { next(err); }
}

module.exports = { list, whitelist, removeWhitelist };
