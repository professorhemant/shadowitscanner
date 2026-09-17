'use strict';

// Mirror of cli/src/scoring/engine.js for server-side use
const SLACK_SCOPE_WEIGHTS = require('../../cli/src/scoring/constants').SLACK_SCOPE_WEIGHTS;
const GOOGLE_SCOPE_WEIGHTS = require('../../cli/src/scoring/constants').GOOGLE_SCOPE_WEIGHTS;
const { EMAIL_SCOPES, CALENDAR_SCOPES, DRIVE_SCOPES, ADMIN_SCOPES, WRITE_SCOPES, getRiskLevel } = require('../../cli/src/scoring/constants');

function scoreApp(app) {
  const scopes = app.scopes || [];
  const source = app.source;
  const weightTable = source === 'slack' ? SLACK_SCOPE_WEIGHTS : GOOGLE_SCOPE_WEIGHTS;

  const factors = [];
  let score = 0;

  let scopeScore = 0;
  for (const scope of scopes) {
    const weight = weightTable[scope];
    if (weight) {
      scopeScore += weight;
      factors.push({ factor: 'scope', scope, weight, detail: `Scope "${scope}" grants significant access` });
    }
  }
  scopeScore = Math.min(scopeScore, 60);
  score += scopeScore;

  if (!app.is_verified) {
    score += 20;
    factors.push({ factor: 'unverified', weight: 20, detail: 'App is not listed in official marketplace' });
  }

  const hasEmail = scopes.some(s => EMAIL_SCOPES.has(s));
  if (hasEmail) { score += 10; factors.push({ factor: 'email_access', weight: 10, detail: 'App can read email' }); }

  const hasCalendar = scopes.some(s => CALENDAR_SCOPES.has(s));
  if (hasCalendar) { score += 8; factors.push({ factor: 'calendar_access', weight: 8, detail: 'App can access calendar' }); }

  const hasDrive = scopes.some(s => DRIVE_SCOPES.has(s));
  if (hasDrive) { score += 12; factors.push({ factor: 'drive_access', weight: 12, detail: 'App can access files' }); }

  const hasAdmin = scopes.some(s => ADMIN_SCOPES.has(s));
  const hasWrite = scopes.some(s => WRITE_SCOPES.has(s));

  if (app.external_domain) { score += 10; factors.push({ factor: 'external_domain', weight: 10, detail: 'App developer is external' }); }
  if (!app.privacy_url) { score += 5; factors.push({ factor: 'no_privacy_policy', weight: 5, detail: 'No privacy policy URL' }); }
  if (app.user_count && app.user_count > 50) { score += 5; factors.push({ factor: 'wide_deployment', weight: 5, detail: `Authorized by ${app.user_count} users` }); }

  const finalScore = Math.min(Math.max(Math.round(score), 0), 100);
  return {
    ...app,
    risk_score: finalScore,
    risk_level: getRiskLevel(finalScore),
    risk_factors: factors,
    has_admin_scope: hasAdmin,
    has_write_scope: hasWrite,
    accesses_email: hasEmail,
    accesses_calendar: hasCalendar,
    accesses_drive: hasDrive,
  };
}

module.exports = { scoreApp };
