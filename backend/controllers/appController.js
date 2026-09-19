'use strict';

const { Op } = require('sequelize');
const { DiscoveredApp, WhitelistedApp, Workspace, PolicyRule } = require('../models');
const { applyRules } = require('../services/policyEngine');
const { logAction } = require('../utils/audit');

async function list(req, res, next) {
  try {
    const { workspace_id, risk_level, source, search, is_ai_tool, page = 1, limit = 50, sort = 'risk_score', order = 'DESC' } = req.query;

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
    if (is_ai_tool === 'true') where.is_ai_tool = true;

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

    // Load and apply policy rules if workspace_id specified
    let rules = [];
    if (workspace_id) {
      rules = await PolicyRule.findAll({
        where: { workspace_id, enabled: true },
        order: [['priority', 'DESC'], ['created_at', 'ASC']],
      });
    }

    const apps = rows.map(a => {
      const base = { ...a.toJSON(), is_whitelisted: wlMap.has(`${a.app_id}:${a.source}`) };
      return rules.length ? applyRules(base, rules) : { ...base, policy_flags: [] };
    });

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
    logAction(req, app.workspace_id, 'app.whitelist', 'app', app.app_id, app.app_name, { source: app.source, reason });
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
    logAction(req, app.workspace_id, 'app.unwhitelist', 'app', app.app_id, app.app_name, { source: app.source });
    res.json({ message: 'Removed from whitelist' });
  } catch (err) { next(err); }
}

async function exportCsv(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const { sequelize, PolicyRule } = require('../models');
    const { QueryTypes } = require('sequelize');

    const apps = await sequelize.query(
      `SELECT DISTINCT ON (app_id) app_id, app_name, developer, source, risk_level, risk_score,
              is_ai_tool, has_admin_scope, has_write_scope, accesses_email, accesses_calendar,
              accesses_drive, external_domain, user_count, is_verified, scopes,
              first_seen_at, last_seen_at
       FROM discovered_apps WHERE workspace_id = :wsId
       ORDER BY app_id, created_at DESC`,
      { replacements: { wsId: workspace_id }, type: QueryTypes.SELECT }
    );

    const rules = await PolicyRule.findAll({
      where: { workspace_id, enabled: true },
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
    });
    const wl = await WhitelistedApp.findAll({ where: { workspace_id } });
    const wlSet = new Set(wl.map(w => `${w.app_id}:${w.source}`));

    const processed = apps.map(app => {
      const base = { ...app, is_whitelisted: wlSet.has(`${app.app_id}:${app.source}`) };
      return rules.length ? applyRules(base, rules) : { ...base, policy_flags: [] };
    });
    processed.sort((a, b) => b.risk_score - a.risk_score);

    function esc(v) {
      if (v == null) return '';
      const s = String(v);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? `"${s.replace(/"/g, '""')}"` : s;
    }

    const headers = [
      'App Name','Developer','Source','Risk Level','Risk Score','Is AI Tool',
      'Has Admin Scope','Accesses Email','Accesses Drive','User Count',
      'Is Verified','Is Whitelisted','Policy Flags','OAuth Scopes','First Seen','Last Seen',
    ];

    const rows = processed.map(a => [
      a.app_name, a.developer || '', a.source, a.risk_level, a.risk_score,
      a.is_ai_tool ? 'Yes' : 'No', a.has_admin_scope ? 'Yes' : 'No',
      a.accesses_email ? 'Yes' : 'No', a.accesses_drive ? 'Yes' : 'No',
      a.user_count || 0, a.is_verified ? 'Yes' : 'No', a.is_whitelisted ? 'Yes' : 'No',
      (a.policy_flags || []).join('; '),
      (Array.isArray(a.scopes) ? a.scopes : []).join('; '),
      a.first_seen_at ? new Date(a.first_seen_at).toISOString().slice(0, 10) : '',
      a.last_seen_at  ? new Date(a.last_seen_at).toISOString().slice(0, 10)  : '',
    ].map(esc).join(','));

    const csv = [headers.map(esc).join(','), ...rows].join('\r\n');
    const slug = ws.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="shadow-it-${slug}-${date}.csv"`);
    res.send('﻿' + csv); // BOM for Excel UTF-8
  } catch (err) { next(err); }
}

async function getDetail(req, res, next) {
  try {
    const app = await DiscoveredApp.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'App not found' });

    const ws = await Workspace.findOne({ where: { id: app.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    // Whitelist info
    const wl = await WhitelistedApp.findOne({
      where: { workspace_id: app.workspace_id, app_id: app.app_id, source: app.source },
    });
    let whitelist_info = null;
    if (wl) {
      const { User } = require('../models');
      const approver = await User.findByPk(wl.approved_by, { attributes: ['name', 'email'] }).catch(() => null);
      whitelist_info = {
        approved_at: wl.approved_at,
        reason: wl.reason,
        approved_by_name: approver?.name || null,
        approved_by_email: approver?.email || null,
        expires_at: wl.expires_at,
      };
    }

    // Policy flags
    const rules = await PolicyRule.findAll({
      where: { workspace_id: app.workspace_id, enabled: true },
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
    });
    const modified = rules.length ? require('../services/policyEngine').applyRules(app.toJSON(), rules) : { policy_flags: [] };

    res.json({
      app: { ...app.toJSON(), is_whitelisted: !!wl, policy_flags: modified.policy_flags },
      whitelist_info,
    });
  } catch (err) { next(err); }
}

async function bulkAction(req, res, next) {
  try {
    const { ids, action, reason } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids array required' });
    if (!['whitelist', 'unwhitelist'].includes(action)) return res.status(400).json({ message: 'action must be whitelist or unwhitelist' });

    // Fetch all requested apps and verify ownership in one shot
    const apps = await DiscoveredApp.findAll({ where: { id: { [Op.in]: ids } } });
    if (!apps.length) return res.status(404).json({ message: 'No apps found' });

    const wsIds = [...new Set(apps.map(a => a.workspace_id))];
    const ownedWs = await Workspace.findAll({ where: { id: { [Op.in]: wsIds }, user_id: req.user.id } });
    const ownedSet = new Set(ownedWs.map(w => w.id));

    const allowed = apps.filter(a => ownedSet.has(a.workspace_id));
    if (!allowed.length) return res.status(403).json({ message: 'Forbidden' });

    let ok = 0;
    for (const app of allowed) {
      if (action === 'whitelist') {
        await WhitelistedApp.upsert({
          workspace_id: app.workspace_id,
          app_id: app.app_id,
          source: app.source,
          approved_by: req.user.id,
          reason: reason || null,
          approved_at: new Date(),
        });
        logAction(req, app.workspace_id, 'app.whitelist', 'app', app.app_id, app.app_name, { source: app.source, reason, bulk: true });
      } else {
        await WhitelistedApp.destroy({ where: { workspace_id: app.workspace_id, app_id: app.app_id, source: app.source } });
        logAction(req, app.workspace_id, 'app.unwhitelist', 'app', app.app_id, app.app_name, { source: app.source, bulk: true });
      }
      ok++;
    }

    res.json({ ok, total: ids.length, action });
  } catch (err) { next(err); }
}

module.exports = { list, getDetail, whitelist, removeWhitelist, exportCsv, bulkAction };
