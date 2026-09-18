'use strict';

const { Workspace, DiscoveredApp } = require('../models');
const { lookupBreaches, highestSeverity } = require('../services/breachRegistry');

async function getBreaches(req, res, next) {
  try {
    const { workspace_id } = req.query;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const apps = await DiscoveredApp.findAll({
      where: { workspace_id },
      attributes: ['app_id', 'app_name', 'developer', 'source', 'user_count', 'risk_level', 'risk_score', 'is_ai_tool'],
      order: [['last_seen_at', 'DESC']],
    });

    // Deduplicate by app_id
    const seen = new Set();
    const unique = [];
    for (const a of apps) {
      if (!seen.has(a.app_id)) { seen.add(a.app_id); unique.push(a); }
    }

    // Cross-reference against breach registry
    const alerts = [];
    for (const a of unique) {
      const result = lookupBreaches(a.app_name, a.developer);
      if (result) {
        alerts.push({
          app_id: a.app_id,
          app_name: a.app_name,
          developer: a.developer,
          source: a.source,
          user_count: a.user_count,
          risk_level: a.risk_level,
          risk_score: a.risk_score,
          is_ai_tool: a.is_ai_tool,
          matched_name: result.app_name,
          breaches: result.breaches,
          highest_severity: highestSeverity(result.breaches),
          latest_breach_date: result.breaches
            .map(b => b.date)
            .sort()
            .reverse()[0],
        });
      }
    }

    // Sort: critical first, then high, then by latest breach date
    const severityOrder = { critical: 0, high: 1, medium: 2 };
    alerts.sort((a, b) => {
      const so = severityOrder[a.highest_severity] - severityOrder[b.highest_severity];
      if (so !== 0) return so;
      return b.latest_breach_date.localeCompare(a.latest_breach_date);
    });

    const counts = { critical: 0, high: 0, medium: 0 };
    for (const a of alerts) counts[a.highest_severity] = (counts[a.highest_severity] || 0) + 1;

    res.json({
      alerts,
      summary: {
        total_apps_scanned: unique.length,
        apps_with_breaches: alerts.length,
        critical_count: counts.critical,
        high_count: counts.high,
        medium_count: counts.medium,
        clean_apps: unique.length - alerts.length,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { getBreaches };
