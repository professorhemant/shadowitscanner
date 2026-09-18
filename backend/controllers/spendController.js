'use strict';

const { Workspace, DiscoveredApp } = require('../models');
const { Op } = require('sequelize');
const { lookupPricing, estimateMonthlyCost } = require('../services/pricingRegistry');

async function getSpend(req, res, next) {
  try {
    const { workspace_id } = req.query;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    // Get unique apps (latest instance per app_id) for this workspace
    const apps = await DiscoveredApp.findAll({
      where: { workspace_id },
      attributes: ['app_id', 'app_name', 'developer', 'source', 'user_count', 'risk_level', 'risk_score', 'is_ai_tool', 'is_whitelisted'],
      order: [['last_seen_at', 'DESC']],
    });

    // Deduplicate by app_id (keep first = most recent)
    const seen = new Set();
    const unique = [];
    for (const a of apps) {
      if (!seen.has(a.app_id)) { seen.add(a.app_id); unique.push(a); }
    }

    // Enrich with pricing
    const enriched = unique.map(a => {
      const pricing = lookupPricing(a.app_name, a.developer);
      const monthly = estimateMonthlyCost(pricing, a.user_count);
      return {
        app_id: a.app_id,
        app_name: a.app_name,
        developer: a.developer,
        source: a.source,
        user_count: a.user_count,
        risk_level: a.risk_level,
        risk_score: a.risk_score,
        is_ai_tool: a.is_ai_tool,
        is_whitelisted: a.is_whitelisted,
        pricing: pricing ? {
          category: pricing.category,
          has_free_tier: pricing.has_free_tier,
          it_plan_name: pricing.it_plan_name,
          it_plan_price_per_user: pricing.it_plan_price_per_user,
          it_plan_price_flat: pricing.it_plan_price_flat,
          it_plan_notes: pricing.it_plan_notes,
        } : null,
        estimated_monthly: monthly,
        estimated_annual: monthly != null ? Math.round(monthly * 12) : null,
        is_custom_pricing: pricing != null && monthly == null,
      };
    }).sort((a, b) => (b.estimated_monthly ?? -1) - (a.estimated_monthly ?? -1));

    const withPricing    = enriched.filter(a => a.pricing != null);
    const withKnownCost  = enriched.filter(a => a.estimated_monthly != null);
    const withCustom     = enriched.filter(a => a.is_custom_pricing);
    const withoutPricing = enriched.filter(a => a.pricing == null);

    const total_monthly = withKnownCost.reduce((s, a) => s + a.estimated_monthly, 0);
    const total_annual  = Math.round(total_monthly * 12);

    res.json({
      apps: enriched,
      summary: {
        total_apps: enriched.length,
        apps_with_known_pricing: withPricing.length,
        apps_with_known_cost: withKnownCost.length,
        apps_custom_pricing: withCustom.length,
        apps_unknown_pricing: withoutPricing.length,
        total_monthly: Math.round(total_monthly * 100) / 100,
        total_annual,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { getSpend };
