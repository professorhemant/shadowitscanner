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

module.exports = { sendAlertEmail };
