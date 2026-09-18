'use strict';

const nodemailer = require('nodemailer');

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const LEVEL_EMOJI = { critical: '🔴', high: '🟠', medium: '🔵', low: '🟢' };

async function sendAlertEmail({ recipients, workspaceName, newApps }) {
  if (!recipients?.length || !process.env.SMTP_HOST) return;
  const transport = getTransport();

  const rows = newApps.map(a =>
    `<tr><td>${a.app_name}</td><td>${a.source}</td><td>${LEVEL_EMOJI[a.risk_level] || ''} ${a.risk_level.toUpperCase()}</td><td>${a.risk_score}</td></tr>`
  ).join('');

  await transport.sendMail({
    from: process.env.ALERT_FROM_EMAIL || 'noreply@shadowit.app',
    to: recipients.join(', '),
    subject: `⚠️ Shadow IT Alert — ${newApps.length} new risk(s) in ${workspaceName}`,
    html: `
      <h2>New high-risk apps detected in <strong>${workspaceName}</strong></h2>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;">
        <tr><th>App</th><th>Source</th><th>Risk</th><th>Score</th></tr>
        ${rows}
      </table>
      <p style="margin-top:16px;">
        <a href="https://shadowit.app/dashboard">View full dashboard →</a>
      </p>`,
  });
}

const RISK_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' };
const RISK_BG    = { critical: '#450a0a', high: '#431407', medium: '#172554', low: '#052e16' };

async function sendNudgeEmail({ recipients, workspaceName, app }) {
  if (!recipients?.length || !process.env.SMTP_HOST) return;
  const transport = getTransport();

  const color = RISK_COLOR[app.risk_level] || '#94a3b8';
  const bg    = RISK_BG[app.risk_level]    || '#1e293b';

  const scopeChips = (app.scopes || []).slice(0, 8).map(s =>
    `<span style="background:#1e293b;border:1px solid #334155;border-radius:4px;padding:2px 8px;font-size:11px;font-family:monospace;color:#94a3b8;margin:2px;display:inline-block;">${s}</span>`
  ).join('');

  const riskFactorRows = (app.risk_factors || []).slice(0, 5).map(f =>
    `<tr><td style="padding:4px 0;font-size:13px;color:#cbd5e1;">• ${f.detail}</td><td style="padding:4px 0 4px 12px;font-size:12px;color:#64748b;white-space:nowrap;">+${f.weight} pts</td></tr>`
  ).join('');

  const aiSection = (app.is_ai_tool && app.ai_risk_flags) ? `
    <div style="background:#1a0533;border:1px solid #7c3aed44;border-radius:8px;padding:16px;margin-top:16px;">
      <div style="font-size:13px;font-weight:600;color:#c4b5fd;margin-bottom:8px;">🤖 AI Tool Risk Flags</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr>
          <td style="padding:3px 0;color:#94a3b8;">Data training clause:</td>
          <td style="padding:3px 0;color:${app.ai_risk_flags.data_training_clause ? '#f87171' : '#86efac'};font-weight:600;">&nbsp;${app.ai_risk_flags.data_training_clause ? 'Yes — ToS permits training' : 'No'}</td>
        </tr>
        <tr>
          <td style="padding:3px 0;color:#94a3b8;">Trains on your data:</td>
          <td style="padding:3px 0;color:${app.ai_risk_flags.trains_on_data ? '#f87171' : '#86efac'};font-weight:600;">&nbsp;${app.ai_risk_flags.trains_on_data ? 'Yes' : 'No'}</td>
        </tr>
        <tr>
          <td style="padding:3px 0;color:#94a3b8;">Data retention:</td>
          <td style="padding:3px 0;color:#e2e8f0;">&nbsp;${app.ai_risk_flags.data_retention || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding:3px 0;color:#94a3b8;">Server geography:</td>
          <td style="padding:3px 0;color:#e2e8f0;">&nbsp;${app.ai_risk_flags.server_geography || 'Unknown'}</td>
        </tr>
      </table>
    </div>` : '';

  const dashboardUrl = process.env.FRONTEND_URL || 'https://shadowit.app';

  await transport.sendMail({
    from: process.env.ALERT_FROM_EMAIL || 'noreply@shadowit.app',
    to: recipients.join(', '),
    subject: `📣 Shadow IT Nudge — ${app.app_name} (${app.risk_level.toUpperCase()}) in ${workspaceName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">

    <!-- Header -->
    <div style="background:#0f172a;padding:20px 24px;border-bottom:1px solid #334155;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:22px;">🛡️</span>
        <span style="color:#e2e8f0;font-weight:700;font-size:16px;">Shadow IT Scanner</span>
      </div>
    </div>

    <!-- App Hero -->
    <div style="padding:24px;">
      <div style="background:${bg};border:1px solid ${color}44;border-radius:10px;padding:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:20px;font-weight:700;color:#f1f5f9;">${app.app_name}</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:2px;text-transform:capitalize;">${app.source} · ${app.developer || 'Unknown developer'}</div>
          </div>
          <div style="text-align:right;">
            <div style="background:${color}22;border:1px solid ${color}55;color:${color};font-weight:700;font-size:12px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${app.risk_level}</div>
            <div style="font-size:26px;font-weight:800;color:${color};margin-top:4px;">${app.risk_score}<span style="font-size:14px;font-weight:500;color:#64748b;">/100</span></div>
          </div>
        </div>
      </div>

      <!-- Why risky -->
      ${riskFactorRows ? `
      <div style="margin-top:20px;">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:8px;">Why is this risky?</div>
        <table style="width:100%;border-collapse:collapse;">${riskFactorRows}</table>
      </div>` : ''}

      <!-- Scopes -->
      ${scopeChips ? `
      <div style="margin-top:16px;">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:8px;">OAuth Scopes Granted</div>
        <div>${scopeChips}</div>
      </div>` : ''}

      <!-- Stats -->
      <div style="display:flex;gap:12px;margin-top:16px;">
        <div style="flex:1;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:#f1f5f9;">${app.user_count}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">Users authorized</div>
        </div>
        <div style="flex:1;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;font-weight:700;color:${app.is_verified ? '#22c55e' : '#ef4444'};">${app.is_verified ? '✔' : '✖'}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">Publisher verified</div>
        </div>
      </div>

      ${aiSection}

      <!-- CTA -->
      <div style="margin-top:24px;text-align:center;">
        <a href="${dashboardUrl}/apps" style="display:inline-block;background:#6366f1;color:#ffffff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Review in Dashboard →
        </a>
      </div>

      <p style="font-size:11px;color:#475569;text-align:center;margin-top:16px;">
        This nudge was sent from <strong>${workspaceName}</strong> via Shadow IT Scanner.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

async function sendApprovalRequestEmail({ itRecipients, workspaceName, request, dashboardUrl }) {
  if (!itRecipients?.length || !process.env.SMTP_HOST) return;
  const transport = getTransport();
  const base = dashboardUrl || process.env.FRONTEND_URL || 'https://shadowit.app';

  await transport.sendMail({
    from: process.env.ALERT_FROM_EMAIL || 'noreply@shadowit.app',
    to: itRecipients.join(', '),
    subject: `📋 New App Approval Request — ${request.app_name} from ${request.requester_name}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
  <div style="background:#0f172a;padding:20px 24px;border-bottom:1px solid #334155;">
    <span style="color:#e2e8f0;font-weight:700;font-size:16px;">🛡️ Shadow IT Scanner</span>
  </div>
  <div style="padding:24px;">
    <h2 style="color:#f1f5f9;font-size:18px;margin:0 0 4px;">New App Approval Request</h2>
    <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;">From <strong style="color:#e2e8f0;">${request.requester_name}</strong> in <strong style="color:#e2e8f0;">${workspaceName}</strong></p>

    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:18px;margin-bottom:16px;">
      <div style="font-size:20px;font-weight:700;color:#f1f5f9;">${request.app_name}</div>
      ${request.app_url ? `<div style="font-size:12px;color:#6366f1;margin-top:2px;">${request.app_url}</div>` : ''}
      ${request.app_description ? `<div style="font-size:13px;color:#94a3b8;margin-top:8px;">${request.app_description}</div>` : ''}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
      <tr>
        <td style="padding:6px 0;color:#64748b;width:140px;">Requester name</td>
        <td style="padding:6px 0;color:#e2e8f0;">${request.requester_name}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748b;">Requester email</td>
        <td style="padding:6px 0;color:#e2e8f0;">${request.requester_email}</td>
      </tr>
      ${request.business_justification ? `<tr>
        <td style="padding:6px 0;color:#64748b;vertical-align:top;">Business reason</td>
        <td style="padding:6px 0;color:#e2e8f0;">${request.business_justification}</td>
      </tr>` : ''}
    </table>

    <div style="text-align:center;margin-top:20px;">
      <a href="${base}/approvals" style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Review Request →
      </a>
    </div>
  </div>
</div>
</body></html>`,
  });
}

async function sendApprovalDecisionEmail({ request, workspaceName }) {
  if (!request.requester_email || !process.env.SMTP_HOST) return;
  const transport = getTransport();
  const approved = request.status === 'approved';
  const color = approved ? '#22c55e' : '#ef4444';
  const bg    = approved ? '#052e16' : '#450a0a';
  const emoji = approved ? '✅' : '❌';

  await transport.sendMail({
    from: process.env.ALERT_FROM_EMAIL || 'noreply@shadowit.app',
    to: request.requester_email,
    subject: `${emoji} Your app request for ${request.app_name} has been ${request.status}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:480px;margin:32px auto;background:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
  <div style="background:#0f172a;padding:20px 24px;border-bottom:1px solid #334155;">
    <span style="color:#e2e8f0;font-weight:700;font-size:16px;">🛡️ Shadow IT Scanner</span>
  </div>
  <div style="padding:24px;">
    <div style="background:${bg};border:1px solid ${color}44;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:32px;margin-bottom:8px;">${emoji}</div>
      <div style="font-size:18px;font-weight:700;color:#f1f5f9;">${request.app_name}</div>
      <div style="font-size:14px;color:${color};font-weight:600;margin-top:4px;text-transform:capitalize;">${request.status}</div>
    </div>

    <p style="color:#cbd5e1;font-size:14px;margin:0 0 12px;">Hi ${request.requester_name},</p>
    <p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">
      Your app approval request for <strong style="color:#e2e8f0;">${request.app_name}</strong> in <strong style="color:#e2e8f0;">${workspaceName}</strong> has been <strong style="color:${color};">${request.status}</strong>${request.reviewed_by ? ` by ${request.reviewed_by}` : ''}.
    </p>

    ${request.review_reason ? `
    <div style="background:#0f172a;border:1px solid #334155;border-left:3px solid ${color};border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px;">
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Reason</div>
      <div style="font-size:13px;color:#e2e8f0;">${request.review_reason}</div>
    </div>` : ''}

    ${approved ? `<p style="color:#94a3b8;font-size:13px;">The app has been approved for use. You may continue using it.</p>` : `<p style="color:#94a3b8;font-size:13px;">If you believe this is an error, please contact your IT administrator.</p>`}
  </div>
</div>
</body></html>`,
  });
}

module.exports = { sendAlertEmail, sendNudgeEmail, sendApprovalRequestEmail, sendApprovalDecisionEmail };
