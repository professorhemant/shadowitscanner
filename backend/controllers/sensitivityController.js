'use strict';

const { Workspace, DiscoveredApp } = require('../models');
const { classifyApp } = require('../services/dataSensitivityClassifier');

async function getSensitivity(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const all = await DiscoveredApp.findAll({
      where: { workspace_id: ws.id },
      order: [['risk_score', 'DESC']],
    });

    // Deduplicate by app_id, keep highest risk_score
    const seen = new Map();
    for (const a of all) {
      if (!seen.has(a.app_id) || seen.get(a.app_id).risk_score < a.risk_score) seen.set(a.app_id, a);
    }
    const apps = [...seen.values()];

    // Classify each app
    const classified = apps.map(a => {
      const cls = classifyApp(a);
      return {
        app_id: a.app_id,
        app_name: a.app_name,
        developer: a.developer,
        source: a.source,
        risk_level: a.risk_level,
        risk_score: a.risk_score,
        is_ai_tool: a.is_ai_tool,
        user_count: a.user_count,
        ...cls,
      };
    });

    // Sort: critical first, then by exposure count desc
    classified.sort((a, b) => {
      const sl = { critical: 4, high: 3, medium: 2, low: 1 };
      const diff = (sl[b.sensitivity_level] || 0) - (sl[a.sensitivity_level] || 0);
      return diff !== 0 ? diff : b.exposure_count - a.exposure_count;
    });

    // Build workspace-level summary
    const exposureCounts = {};
    let ai_with_data_access = 0;
    let critical_count = 0;
    let high_count = 0;
    let no_exposure = 0;

    for (const c of classified) {
      if (c.sensitivity_level === 'critical') critical_count++;
      else if (c.sensitivity_level === 'high') high_count++;
      if (c.exposure_count === 0) no_exposure++;
      if (c.amplified_by_ai) ai_with_data_access++;
      for (const e of c.exposures) {
        exposureCounts[e.key] = (exposureCounts[e.key] || { key: e.key, label: e.label, icon: e.icon, count: 0 });
        exposureCounts[e.key].count++;
      }
    }

    const exposureBreakdown = Object.values(exposureCounts)
      .sort((a, b) => b.count - a.count);

    res.json({
      workspace: { id: ws.id, name: ws.name },
      summary: {
        total_apps: classified.length,
        critical_count,
        high_count,
        ai_with_data_access,
        clean_apps: no_exposure,
        top_exposure: exposureBreakdown[0] || null,
      },
      exposure_breakdown: exposureBreakdown,
      apps: classified,
    });
  } catch (err) { next(err); }
}

module.exports = { getSensitivity };
