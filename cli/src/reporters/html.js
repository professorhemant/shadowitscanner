'use strict';

const fs = require('fs');
const path = require('path');

const LEVEL_COLORS = {
  critical: { bg: '#ef4444', text: '#fff', border: '#dc2626' },
  high: { bg: '#f97316', text: '#fff', border: '#ea580c' },
  medium: { bg: '#3b82f6', text: '#fff', border: '#2563eb' },
  low: { bg: '#22c55e', text: '#fff', border: '#16a34a' },
};

function badge(level) {
  const c = LEVEL_COLORS[level] || LEVEL_COLORS.low;
  return `<span style="background:${c.bg};color:${c.text};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase;">${level}</span>`;
}

function row(app) {
  const scopes = (app.scopes || []).slice(0, 3).join(', ') || '—';
  const verified = app.is_verified
    ? '<span style="color:#22c55e;">✔ Yes</span>'
    : '<span style="color:#ef4444;">✖ No</span>';
  return `
    <tr>
      <td>${escHtml(app.app_name)}</td>
      <td>${escHtml(app.source)}</td>
      <td>${badge(app.risk_level)}</td>
      <td><strong>${app.risk_score}</strong></td>
      <td style="font-size:12px;color:#6b7280;">${escHtml(scopes)}</td>
      <td>${verified}</td>
    </tr>`;
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateHTML(results) {
  const allApps = results.flatMap(r => r.apps || []);
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of allApps) counts[a.risk_level]++;
  const sorted = [...allApps].sort((a, b) => b.risk_score - a.risk_score);
  const date = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Shadow IT Scan Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:32px}
  .header{margin-bottom:32px}
  .header h1{font-size:28px;font-weight:700;color:#f1f5f9}
  .header p{color:#94a3b8;margin-top:6px}
  .cards{display:flex;gap:16px;margin-bottom:32px;flex-wrap:wrap}
  .card{background:#1e293b;border-radius:12px;padding:20px 28px;flex:1;min-width:140px;border-left:4px solid}
  .card-critical{border-color:#ef4444}.card-high{border-color:#f97316}.card-medium{border-color:#3b82f6}.card-low{border-color:#22c55e}
  .card .count{font-size:36px;font-weight:700}.card .label{font-size:13px;color:#94a3b8;margin-top:4px}
  table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden}
  th{background:#0f172a;padding:12px 16px;text-align:left;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
  td{padding:12px 16px;border-bottom:1px solid #334155;font-size:14px}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#263347}
  .cta{margin-top:40px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:12px;padding:28px 32px;text-align:center}
  .cta h2{font-size:20px;margin-bottom:8px}
  .cta p{color:#bfdbfe;margin-bottom:16px}
  .cta a{background:#fff;color:#1d4ed8;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px}
  .section-title{font-size:18px;font-weight:600;margin-bottom:16px;color:#f1f5f9}
</style>
</head>
<body>
<div class="header">
  <h1>Shadow IT Scan Report</h1>
  <p>Generated: ${escHtml(date)} &nbsp;·&nbsp; Total apps found: <strong>${allApps.length}</strong></p>
</div>

<div class="cards">
  <div class="card card-critical"><div class="count">${counts.critical}</div><div class="label">Critical</div></div>
  <div class="card card-high"><div class="count">${counts.high}</div><div class="label">High</div></div>
  <div class="card card-medium"><div class="count">${counts.medium}</div><div class="label">Medium</div></div>
  <div class="card card-low"><div class="count">${counts.low}</div><div class="label">Low</div></div>
</div>

<p class="section-title">App Inventory</p>
<table>
  <thead>
    <tr>
      <th>App Name</th><th>Source</th><th>Risk Level</th><th>Score</th><th>Top Scopes</th><th>Verified</th>
    </tr>
  </thead>
  <tbody>
    ${sorted.map(row).join('')}
  </tbody>
</table>

<div class="cta">
  <h2>Track trends, set alerts & manage your whitelist</h2>
  <p>Upload these results to the Shadow IT Dashboard for full history, scheduled scans, and team collaboration.</p>
  <a href="https://shadowit.app" target="_blank">Open Shadow IT Dashboard →</a>
</div>
</body>
</html>`;
}

function writeHTML(results, outputPath) {
  const html = generateHTML(results);
  fs.writeFileSync(outputPath, html, 'utf8');
  return outputPath;
}

module.exports = { writeHTML, generateHTML };
