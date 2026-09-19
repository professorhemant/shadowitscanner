'use strict';

const { AuditLog, Workspace } = require('../models');
const { Op } = require('sequelize');

async function list(req, res, next) {
  try {
    const { workspace_id, action, actor_email, from, to, limit = 100, offset = 0 } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const where = { workspace_id };
    if (action) where.action = action;
    if (actor_email) where.actor_email = { [Op.iLike]: `%${actor_email}%` };
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at[Op.gte] = new Date(from);
      if (to)   where.created_at[Op.lte] = new Date(to);
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Math.min(Number(limit), 500),
      offset: Number(offset),
    });

    res.json({ logs: rows, total: count });
  } catch (err) { next(err); }
}

async function exportCsv(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const logs = await AuditLog.findAll({
      where: { workspace_id },
      order: [['created_at', 'DESC']],
      limit: 5000,
    });

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Timestamp','Actor','Email','Action','Resource Type','Resource','Details'];
    const rows = logs.map(l => [
      esc(new Date(l.created_at).toISOString()),
      esc(l.actor_name || 'system'),
      esc(l.actor_email || ''),
      esc(l.action),
      esc(l.resource_type || ''),
      esc(l.resource_name || l.resource_id || ''),
      esc(JSON.stringify(l.meta || {})),
    ]);

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-log-${workspace_id}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}

// Returns distinct action types for this workspace (for filter dropdown)
async function actionTypes(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const rows = await AuditLog.findAll({
      where: { workspace_id },
      attributes: ['action'],
      group: ['action'],
      order: [['action', 'ASC']],
    });
    res.json({ actions: rows.map(r => r.action) });
  } catch (err) { next(err); }
}

module.exports = { list, exportCsv, actionTypes };
