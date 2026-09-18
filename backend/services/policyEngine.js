'use strict';

const LEVEL_ORDER  = { low: 0, medium: 1, high: 2, critical: 3 };
const LEVEL_NAMES  = ['low', 'medium', 'high', 'critical'];

function scoreToLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function evaluateCondition(rule, app) {
  const cv = (rule.condition_value || '').toLowerCase();
  switch (rule.condition_type) {
    case 'app_name_contains':       return app.app_name?.toLowerCase().includes(cv);
    case 'developer_contains':      return app.developer?.toLowerCase().includes(cv);
    case 'has_scope_containing':    return (app.scopes || []).some(s => s.toLowerCase().includes(cv));
    case 'is_ai_tool':              return !!app.is_ai_tool;
    case 'has_admin_scope':         return !!app.has_admin_scope;
    case 'accesses_email':          return !!app.accesses_email;
    case 'accesses_drive':          return !!app.accesses_drive;
    case 'has_external_domain':     return !!app.external_domain;
    case 'risk_score_gte':          return app.risk_score >= Number(rule.condition_value);
    case 'source_equals':           return app.source === cv;
    case 'user_count_gte':          return (app.user_count || 0) >= Number(rule.condition_value);
    default:                        return false;
  }
}

function applyAction(rule, app) {
  switch (rule.action_type) {
    case 'set_level':
      return { ...app, risk_level: rule.action_value };
    case 'escalate_level': {
      const current = LEVEL_ORDER[app.risk_level] ?? 0;
      const target  = LEVEL_ORDER[rule.action_value] ?? 0;
      return target > current ? { ...app, risk_level: rule.action_value } : app;
    }
    case 'add_score': {
      const newScore = Math.min(100, Math.max(0, (app.risk_score || 0) + Number(rule.action_value)));
      return { ...app, risk_score: newScore, risk_level: scoreToLevel(newScore) };
    }
    default: return app;
  }
}

// Returns app with policy_flags[] added listing matched rule names
function applyRules(app, rules) {
  const sorted = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const policy_flags = [];
  let result = { ...app };

  for (const rule of sorted) {
    if (!rule.enabled) continue;
    if (evaluateCondition(rule, result)) {
      result = applyAction(rule, result);
      policy_flags.push(rule.name);
    }
  }

  return { ...result, policy_flags };
}

module.exports = { applyRules };
