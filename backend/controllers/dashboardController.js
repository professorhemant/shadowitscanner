'use strict';

const { Op, fn, col, literal } = require('sequelize');
const { DiscoveredApp, ScanRun, Workspace } = require('../models');

async function stats(req, res, next) {
  try {
    const { workspace_id } = req.query;

    // Resolve workspace IDs this user owns
    const wsWhere = { user_id: req.user.id };
    if (workspace_id) wsWhere.id = workspace_id;
    const workspaces = await Workspace.findAll({ where: wsWhere, attributes: ['id'] });
    const wsIds = workspaces.map(w => w.id);
    if (!wsIds.length) return res.json({ counts: {}, trend: [], top_risky: [] });

    const appWhere = { workspace_id: { [Op.in]: wsIds } };

    // Risk level counts
    const countRows = await DiscoveredApp.findAll({
      where: appWhere,
      attributes: ['risk_level', [fn('COUNT', col('id')), 'count']],
      group: ['risk_level'],
      raw: true,
    });
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const r of countRows) counts[r.risk_level] = Number(r.count);

    // Trend: scans per day for last 30 days
    const trend = await ScanRun.findAll({
      where: {
        workspace_id: { [Op.in]: wsIds },
        status: 'completed',
        created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
      },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('SUM', col('apps_found')), 'apps'],
        [fn('SUM', col('critical_count')), 'critical'],
        [fn('SUM', col('high_count')), 'high'],
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Top 5 riskiest apps
    const top_risky = await DiscoveredApp.findAll({
      where: appWhere,
      order: [['risk_score', 'DESC']],
      limit: 5,
      attributes: ['id', 'app_name', 'source', 'risk_score', 'risk_level', 'is_verified', 'user_count', 'is_ai_tool'],
    });

    res.json({
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      trend,
      top_risky,
    });
  } catch (err) { next(err); }
}

module.exports = { stats };
