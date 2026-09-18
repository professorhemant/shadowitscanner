'use strict';

const { Workspace, ScanRun, DiscoveredApp } = require('../models');
const { scoreApp } = require('../services/riskEngine');

const CATEGORY_RISK = {
  ai: { base_score: 25, is_verified: false },
  security: { base_score: 10, is_verified: true },
  cloud: { base_score: 15, is_verified: true },
  dev: { base_score: 10, is_verified: true },
  productivity: { base_score: 5, is_verified: true },
  communication: { base_score: 5, is_verified: true },
  crm: { base_score: 10, is_verified: true },
  hr: { base_score: 15, is_verified: true },
  finance: { base_score: 20, is_verified: true },
  storage: { base_score: 12, is_verified: true },
  marketing: { base_score: 5, is_verified: true },
  design: { base_score: 5, is_verified: true },
  analytics: { base_score: 8, is_verified: true },
  devops: { base_score: 12, is_verified: true },
  support: { base_score: 5, is_verified: true },
};

async function report(req, res, next) {
  try {
    const { workspace_id, apps } = req.body;
    if (!workspace_id || !Array.isArray(apps) || apps.length === 0) {
      return res.status(400).json({ message: 'workspace_id and apps array required' });
    }

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    // Create a scan run for this batch
    const run = await ScanRun.create({
      workspace_id: ws.id,
      triggered_by: 'extension',
      source: 'extension',
      status: 'running',
      started_at: new Date(),
    });

    const scored = apps.map(app => {
      const catMeta = CATEGORY_RISK[app.category] || { base_score: 10, is_verified: false };
      const result = scoreApp({
        source: 'extension',
        app_id: app.app_id,
        app_name: app.app_name,
        developer: app.developer || '',
        scopes: [],
        is_verified: catMeta.is_verified,
        user_count: 1,
        external_domain: true,
        privacy_url: null,
        raw_data: { category: app.category, hostname: app.hostname, visit_count: app.visit_count || 1 },
      });

      return {
        scan_run_id: run.id,
        workspace_id: ws.id,
        source: 'extension',
        app_id: app.app_id,
        app_name: app.app_name,
        app_description: `Detected via browser extension (${app.category || 'web'})`,
        developer: app.developer || '',
        developer_url: '',
        icon_url: '',
        scopes: [],
        raw_data: { category: app.category, hostname: app.hostname, visit_count: app.visit_count || 1 },
        is_verified: catMeta.is_verified,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        risk_factors: result.risk_factors,
        has_admin_scope: false,
        has_write_scope: false,
        accesses_email: false,
        accesses_calendar: false,
        accesses_drive: false,
        external_domain: true,
        user_count: 1,
        is_ai_tool: result.is_ai_tool,
        ai_risk_flags: result.ai_risk_flags || null,
        first_seen_at: app.first_seen_at ? new Date(app.first_seen_at) : new Date(),
        last_seen_at: app.last_seen_at ? new Date(app.last_seen_at) : new Date(),
      };
    });

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of scored) counts[a.risk_level] = (counts[a.risk_level] || 0) + 1;

    await DiscoveredApp.bulkCreate(scored, { ignoreDuplicates: true });

    await run.update({
      status: 'completed',
      apps_found: scored.length,
      critical_count: counts.critical || 0,
      high_count: counts.high || 0,
      medium_count: counts.medium || 0,
      low_count: counts.low || 0,
      completed_at: new Date(),
    });

    await Workspace.update({ last_scan_at: new Date() }, { where: { id: ws.id } });

    res.json({
      received: apps.length,
      scan_id: run.id,
      message: `${scored.length} apps processed`,
    });
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const { Op } = require('sequelize');
    const apps = await DiscoveredApp.findAll({
      where: { workspace_id: ws.id, source: 'extension' },
      order: [['risk_score', 'DESC']],
    });

    // Deduplicate by app_id keeping highest risk
    const seen = new Map();
    for (const a of apps) {
      if (!seen.has(a.app_id) || seen.get(a.app_id).risk_score < a.risk_score) seen.set(a.app_id, a);
    }
    const unique = [...seen.values()];

    const summary = {
      total: unique.length,
      ai_tools: unique.filter(a => a.is_ai_tool).length,
      critical: unique.filter(a => a.risk_level === 'critical').length,
      high: unique.filter(a => a.risk_level === 'high').length,
    };

    res.json({ summary, apps: unique.map(a => ({
      app_id: a.app_id,
      app_name: a.app_name,
      developer: a.developer,
      risk_score: a.risk_score,
      risk_level: a.risk_level,
      is_ai_tool: a.is_ai_tool,
      category: a.raw_data?.category || 'web',
      last_seen_at: a.last_seen_at,
    })) });
  } catch (err) { next(err); }
}

module.exports = { report, getStats };
