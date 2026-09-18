'use strict';

const { SLACK_SCOPE_WEIGHTS, GOOGLE_SCOPE_WEIGHTS, MICROSOFT_SCOPE_WEIGHTS, EMAIL_SCOPES, CALENDAR_SCOPES, DRIVE_SCOPES, ADMIN_SCOPES, WRITE_SCOPES, getRiskLevel } = require('../utils/scoringConstants');
const { detectAITool } = require('./aiToolsRegistry');

function scoreApp(app) {
  const scopes = app.scopes || [];
  const source = app.source;
  const weightTable = source === 'slack' ? SLACK_SCOPE_WEIGHTS
    : source === 'microsoft' ? MICROSOFT_SCOPE_WEIGHTS
    : GOOGLE_SCOPE_WEIGHTS;

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

  // AI tool detection
  const aiTool = detectAITool(app.app_name, app.developer);
  let isAITool = false;
  let aiRiskFlags = null;

  if (aiTool) {
    isAITool = true;
    aiRiskFlags = {
      canonical_name: aiTool.canonical_name,
      category: aiTool.category,
      data_training_clause: aiTool.data_training_clause,
      data_retention: aiTool.data_retention,
      server_geography: aiTool.server_geography,
      trains_on_data: aiTool.trains_on_data,
      notes: aiTool.notes,
    };

    if (aiTool.data_training_clause) {
      score += 15;
      factors.push({ factor: 'ai_data_training', weight: 15, detail: `${aiTool.canonical_name} ToS includes a data training clause` });
    }
    if (aiTool.trains_on_data) {
      score += 10;
      factors.push({ factor: 'ai_trains_on_data', weight: 10, detail: `${aiTool.canonical_name} may train its models on submitted data` });
    }
    if (aiTool.data_retention === 'Unknown') {
      score += 8;
      factors.push({ factor: 'ai_unknown_retention', weight: 8, detail: `${aiTool.canonical_name} has an unknown data retention policy` });
    }
    if (hasEmail) {
      score += 8;
      factors.push({ factor: 'ai_email_access', weight: 8, detail: `AI tool reading email — risk of sensitive data ingestion` });
    }
    if (hasDrive) {
      score += 10;
      factors.push({ factor: 'ai_file_access', weight: 10, detail: `AI tool accessing files — risk of IP or confidential doc exposure` });
    }
    if (hasCalendar) {
      score += 5;
      factors.push({ factor: 'ai_calendar_access', weight: 5, detail: `AI tool reading calendar — meeting context and attendees exposed` });
    }
  }

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
    is_ai_tool: isAITool,
    ai_risk_flags: aiRiskFlags,
  };
}

module.exports = { scoreApp };
