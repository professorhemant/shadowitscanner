'use strict';

const { Workspace, PolicyRule, DiscoveredApp } = require('../models');
const { applyRules } = require('../services/policyEngine');

const VALID_CONDITIONS = [
  'app_name_contains','developer_contains','has_scope_containing',
  'is_ai_tool','has_admin_scope','accesses_email','accesses_drive',
  'has_external_domain','risk_score_gte','source_equals','user_count_gte',
];
const BOOLEAN_CONDITIONS = ['is_ai_tool','has_admin_scope','accesses_email','accesses_drive','has_external_domain'];
const VALID_ACTIONS  = ['set_level','escalate_level','add_score'];
const VALID_LEVELS   = ['low','medium','high','critical'];

async function list(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const rules = await PolicyRule.findAll({
      where: { workspace_id },
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
    });
    res.json({ rules });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { workspace_id, name, condition_type, condition_value, action_type, action_value, priority } = req.body;
    if (!workspace_id || !name || !condition_type || !action_type || !action_value) {
      return res.status(400).json({ message: 'workspace_id, name, condition_type, action_type, action_value required' });
    }
    if (!VALID_CONDITIONS.includes(condition_type)) return res.status(400).json({ message: 'Invalid condition_type' });
    if (!VALID_ACTIONS.includes(action_type))       return res.status(400).json({ message: 'Invalid action_type' });
    if ((action_type === 'set_level' || action_type === 'escalate_level') && !VALID_LEVELS.includes(action_value)) {
      return res.status(400).json({ message: 'action_value must be a risk level' });
    }
    if (!BOOLEAN_CONDITIONS.includes(condition_type) && !condition_value?.trim()) {
      return res.status(400).json({ message: 'condition_value required for this condition type' });
    }

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const rule = await PolicyRule.create({
      workspace_id, name: name.trim(),
      condition_type, condition_value: condition_value?.trim() || null,
      action_type, action_value,
      priority: Number(priority) || 0,
      enabled: true,
    });
    res.json({ rule, message: 'Policy rule created' });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const rule = await PolicyRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    const ws = await Workspace.findOne({ where: { id: rule.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });

    const { name, enabled, priority, action_type, action_value } = req.body;
    const updates = {};
    if (name      !== undefined) updates.name     = name;
    if (enabled   !== undefined) updates.enabled  = !!enabled;
    if (priority  !== undefined) updates.priority = Number(priority);
    if (action_type  !== undefined) updates.action_type  = action_type;
    if (action_value !== undefined) updates.action_value = action_value;
    await rule.update(updates);
    res.json({ message: 'Rule updated' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const rule = await PolicyRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    const ws = await Workspace.findOne({ where: { id: rule.workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(403).json({ message: 'Forbidden' });
    await rule.destroy();
    res.json({ message: 'Rule deleted' });
  } catch (err) { next(err); }
}

// Preview: show which current apps would be affected by workspace rules
async function preview(req, res, next) {
  try {
    const { workspace_id } = req.query;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const rules = await PolicyRule.findAll({
      where: { workspace_id, enabled: true },
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
    });

    if (!rules.length) return res.json({ affected: [], total_apps: 0 });

    // Deduplicate: latest entry per app_id
    const [uniqueApps] = await require('../models').sequelize.query(
      `SELECT DISTINCT ON (app_id) app_id, app_name, developer, risk_level, risk_score,
              is_ai_tool, has_admin_scope, accesses_email, accesses_drive,
              external_domain, user_count, scopes, source
       FROM discovered_apps WHERE workspace_id = :wsId ORDER BY app_id, created_at DESC`,
      { replacements: { wsId: workspace_id }, type: require('sequelize').QueryTypes.SELECT }
    ).catch(() => [[]]);

    const plainApps = Array.isArray(uniqueApps[0]) ? uniqueApps[0] : uniqueApps;

    const affected = [];
    for (const app of plainApps) {
      const original_level = app.risk_level;
      const original_score = app.risk_score;
      const modified = applyRules(app, rules);
      if (modified.policy_flags.length > 0) {
        affected.push({
          app_id: app.app_id,
          app_name: app.app_name,
          original_level,
          original_score,
          new_level: modified.risk_level,
          new_score: modified.risk_score,
          policy_flags: modified.policy_flags,
        });
      }
    }

    res.json({ affected, total_apps: plainApps.length });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, preview };
