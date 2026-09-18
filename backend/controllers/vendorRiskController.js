'use strict';

const { Workspace, DiscoveredApp } = require('../models');
const { lookupVendor, scoreVendor, COUNTRY_NAMES, COUNTRY_FLAGS, HIGH_RISK_COUNTRIES } = require('../services/vendorRiskRegistry');

async function getVendorRisk(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const all = await DiscoveredApp.findAll({
      where: { workspace_id: ws.id },
      order: [['risk_score', 'DESC']],
    });

    // Deduplicate by app_id
    const seen = new Map();
    for (const a of all) {
      if (!seen.has(a.app_id) || seen.get(a.app_id).risk_score < a.risk_score) seen.set(a.app_id, a);
    }
    const apps = [...seen.values()];

    const scored = apps.map(a => {
      const vendor = lookupVendor(a.app_name, a.developer);
      const { vendor_risk_score, vendor_risk_level, vendor_risk_factors } = scoreVendor(vendor);

      return {
        app_id: a.app_id,
        app_name: a.app_name,
        developer: a.developer,
        source: a.source,
        risk_level: a.risk_level,
        risk_score: a.risk_score,
        is_ai_tool: a.is_ai_tool,
        // vendor details
        vendor_found: !!vendor,
        legal_entity: vendor?.legal_entity || null,
        hq_country: vendor?.hq_country || null,
        hq_country_name: vendor ? (COUNTRY_NAMES[vendor.hq_country] || vendor.hq_country) : null,
        hq_country_flag: vendor ? (COUNTRY_FLAGS[vendor.hq_country] || '🏳️') : null,
        hq_region: vendor?.hq_region || null,
        high_risk_jurisdiction: vendor ? HIGH_RISK_COUNTRIES.has(vendor.hq_country) : false,
        soc2: vendor?.soc2 ?? null,
        iso27001: vendor?.iso27001 ?? null,
        gdpr: vendor?.gdpr ?? null,
        fedramp: vendor?.fedramp ?? null,
        certifications: vendor?.certifications || [],
        privacy_policy_date: vendor?.privacy_policy_date || null,
        data_centers: vendor?.data_centers || [],
        notes: vendor?.notes || null,
        vendor_risk_score,
        vendor_risk_level,
        vendor_risk_factors,
      };
    });

    // Sort by vendor risk score desc
    scored.sort((a, b) => b.vendor_risk_score - a.vendor_risk_score);

    // Summary
    const high_risk_jurisdiction = scored.filter(a => a.high_risk_jurisdiction).length;
    const no_soc2 = scored.filter(a => a.soc2 === false).length;
    const no_gdpr = scored.filter(a => a.gdpr === false).length;
    const unknown_vendor = scored.filter(a => !a.vendor_found).length;
    const critical_vendor = scored.filter(a => a.vendor_risk_level === 'critical').length;

    // Country breakdown
    const countryMap = {};
    for (const a of scored) {
      if (!a.hq_country) continue;
      const key = a.hq_country;
      if (!countryMap[key]) countryMap[key] = { country: key, name: a.hq_country_name, flag: a.hq_country_flag, count: 0, high_risk: HIGH_RISK_COUNTRIES.has(key) };
      countryMap[key].count++;
    }
    const country_breakdown = Object.values(countryMap).sort((a, b) => b.count - a.count);

    res.json({
      workspace: { id: ws.id, name: ws.name },
      summary: { total_apps: scored.length, critical_vendor, high_risk_jurisdiction, no_soc2, no_gdpr, unknown_vendor },
      country_breakdown,
      apps: scored,
    });
  } catch (err) { next(err); }
}

module.exports = { getVendorRisk };
