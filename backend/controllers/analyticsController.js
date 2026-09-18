'use strict';

const { Workspace, ScanRun, DiscoveredApp, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');

function isoWeekStart(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

async function getAnalytics(req, res, next) {
  try {
    const { workspace_id, days = 90 } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const cutoff = new Date(Date.now() - Number(days) * 86400000);

    // ── Scan run trend (one data point per week = last scan of that week) ───
    const runs = await ScanRun.findAll({
      where: { workspace_id, status: 'completed', started_at: { [Op.gte]: cutoff } },
      order: [['started_at', 'ASC']],
      attributes: ['started_at', 'apps_found', 'critical_count', 'high_count', 'medium_count', 'low_count'],
    });
    const weekMap = {};
    for (const r of runs) {
      const w = isoWeekStart(r.started_at);
      weekMap[w] = {
        week: w,
        apps_found: r.apps_found || 0,
        critical: r.critical_count || 0,
        high: r.high_count || 0,
        medium: r.medium_count || 0,
        low: r.low_count || 0,
      };
    }
    const trend = Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));

    // ── Latest scan distribution ─────────────────────────────────────────────
    const latestRun = await ScanRun.findOne({
      where: { workspace_id, status: 'completed' },
      order: [['started_at', 'DESC']],
    });
    const distribution = latestRun
      ? {
          critical: latestRun.critical_count || 0,
          high:     latestRun.high_count || 0,
          medium:   latestRun.medium_count || 0,
          low:      latestRun.low_count || 0,
          total:    latestRun.apps_found || 0,
        }
      : { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

    // ── New apps per week (by first_seen_at, deduplicated) ───────────────────
    const newAppsRows = await DiscoveredApp.findAll({
      where: { workspace_id, first_seen_at: { [Op.gte]: cutoff } },
      attributes: ['app_id', 'first_seen_at'],
    });
    const seenIds = new Set();
    const newWeekMap = {};
    for (const a of newAppsRows) {
      if (seenIds.has(a.app_id)) continue;
      seenIds.add(a.app_id);
      const w = isoWeekStart(a.first_seen_at);
      if (!newWeekMap[w]) newWeekMap[w] = { week: w, count: 0 };
      newWeekMap[w].count++;
    }
    const new_apps_by_week = Object.values(newWeekMap).sort((a, b) => a.week.localeCompare(b.week));

    // ── Top 10 riskiest apps (deduped DISTINCT ON app_id) ───────────────────
    const allUnique = await sequelize.query(
      `SELECT DISTINCT ON (app_id) app_id, app_name, developer, risk_level, risk_score,
              is_ai_tool, user_count, last_seen_at
       FROM discovered_apps
       WHERE workspace_id = :wsId
       ORDER BY app_id, created_at DESC`,
      { replacements: { wsId: workspace_id }, type: QueryTypes.SELECT }
    );
    allUnique.sort((a, b) => b.risk_score - a.risk_score);
    const top_apps = allUnique.slice(0, 10);

    // ── Summary KPIs ─────────────────────────────────────────────────────────
    const total_scans = await ScanRun.count({ where: { workspace_id, status: 'completed' } });
    const total_apps  = allUnique.length;
    const ai_tools    = allUnique.filter(a => a.is_ai_tool).length;
    const avg_score   = total_apps
      ? Math.round(allUnique.reduce((s, a) => s + a.risk_score, 0) / total_apps)
      : 0;
    const clean_pct   = total_apps
      ? Math.round(allUnique.filter(a => a.risk_level === 'low' || a.risk_level === 'medium').length / total_apps * 100)
      : 100;

    res.json({
      trend,
      distribution,
      new_apps_by_week,
      top_apps,
      summary: { total_scans, total_apps, ai_tools, avg_score, clean_pct },
    });
  } catch (err) { next(err); }
}

module.exports = { getAnalytics };
