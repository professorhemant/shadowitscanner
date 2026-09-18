'use strict';

const PDFDocument = require('pdfkit');
const { Workspace, DiscoveredApp, WhitelistedApp, ScanRun } = require('../models');

// Colors
const C = {
  brand:    '#6366f1',
  brandDark:'#4f46e5',
  dark:     '#0f172a',
  slate:    '#1e293b',
  gray:     '#64748b',
  light:    '#94a3b8',
  text:     '#1e293b',
  white:    '#ffffff',
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#3b82f6',
  low:      '#22c55e',
  bg:       '#f8fafc',
};

const RISK_COLOR = { critical: C.critical, high: C.high, medium: C.medium, low: C.low };

function hex2rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildPDF(doc, { workspace, apps, whitelist, scanRun, counts, aiTools }) {
  const W = doc.page.width;
  const M = 50;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const scanDate = scanRun?.completed_at
    ? new Date(scanRun.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : dateStr;

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────
  // Dark header band
  doc.rect(0, 0, W, 240).fill(C.dark);

  // Brand bar
  doc.rect(0, 0, 6, 240).fill(C.brand);

  // Title
  doc.fillColor(C.brand).fontSize(11).font('Helvetica-Bold')
     .text('SHADOW IT SCANNER', M + 10, 55, { characterSpacing: 2 });

  doc.fillColor(C.white).fontSize(28).font('Helvetica-Bold')
     .text('Shadow IT', M + 10, 82);
  doc.fillColor(C.white).fontSize(28).font('Helvetica-Bold')
     .text('Compliance Report', M + 10, 115);

  doc.fillColor(C.light).fontSize(11).font('Helvetica')
     .text(`Generated ${dateStr}`, M + 10, 165);

  // Framework badges row
  const badges = ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA'];
  let bx = M + 10;
  const by = 195;
  badges.forEach(b => {
    const bw = doc.widthOfString(b) + 20;
    doc.roundedRect(bx, by, bw, 22, 4).fillAndStroke(C.brand, C.brand);
    doc.fillColor(C.white).fontSize(9).font('Helvetica-Bold').text(b, bx + 10, by + 6);
    bx += bw + 8;
  });

  // Workspace info box
  doc.rect(M, 270, W - M * 2, 90).fill(C.bg).stroke('#e2e8f0');
  doc.fillColor(C.gray).fontSize(9).font('Helvetica-Bold')
     .text('ORGANIZATION', M + 20, 285, { characterSpacing: 1 });
  doc.fillColor(C.text).fontSize(16).font('Helvetica-Bold')
     .text(workspace.name, M + 20, 300);
  doc.fillColor(C.gray).fontSize(9)
     .text(`Last scan: ${scanDate}  ·  ${apps.length} apps discovered  ·  ${whitelist.length} approved`, M + 20, 328);

  // Key risk numbers
  const boxes = [
    { label: 'Critical', value: counts.critical, color: C.critical },
    { label: 'High',     value: counts.high,     color: C.high },
    { label: 'Medium',   value: counts.medium,   color: C.medium },
    { label: 'Low',      value: counts.low,      color: C.low },
  ];
  const bWidth = (W - M * 2 - 30) / 4;
  boxes.forEach((b, i) => {
    const bx2 = M + i * (bWidth + 10);
    const by2 = 390;
    doc.rect(bx2, by2, bWidth, 80).fill(C.slate);
    doc.rect(bx2, by2, bWidth, 4).fill(b.color);
    doc.fillColor(b.color).fontSize(32).font('Helvetica-Bold')
       .text(String(b.value), bx2 + 16, by2 + 18);
    doc.fillColor(C.light).fontSize(10).font('Helvetica')
       .text(b.label, bx2 + 16, by2 + 56);
  });

  // AI tools highlight
  if (aiTools.length > 0) {
    doc.rect(M, 500, W - M * 2, 50).fill('#1a0533').stroke('#7c3aed44');
    doc.fillColor('#c4b5fd').fontSize(9).font('Helvetica-Bold')
       .text(`🤖  ${aiTools.length} AI TOOL${aiTools.length !== 1 ? 'S' : ''} DETECTED  —  ` +
         aiTools.map(a => a.app_name).slice(0, 6).join(', ') +
         (aiTools.length > 6 ? ` +${aiTools.length - 6} more` : ''),
         M + 20, 520, { width: W - M * 2 - 40 });
  }

  // Confidentiality footer
  doc.fillColor(C.light).fontSize(8).font('Helvetica')
     .text('CONFIDENTIAL — FOR INTERNAL USE ONLY', 0, doc.page.height - 40, { align: 'center', width: W });

  // ── PAGE 2: EXECUTIVE SUMMARY ───────────────────────────────────────────────
  doc.addPage();
  pageHeader(doc, 'Executive Summary', W, M);

  let y = 110;

  // Stats paragraph
  const totalApps = apps.length;
  const critHighApps = apps.filter(a => a.risk_level === 'critical' || a.risk_level === 'high');
  const adminScopeApps = apps.filter(a => a.has_admin_scope);
  const emailApps = apps.filter(a => a.accesses_email);
  const driveApps = apps.filter(a => a.accesses_drive);
  const unverifiedApps = apps.filter(a => !a.is_verified);

  doc.fillColor(C.text).fontSize(10).font('Helvetica').lineGap(4)
     .text(`This report presents the findings from a Shadow IT scan of ${workspace.name} conducted on ${scanDate}. ` +
       `The scan identified ${totalApps} third-party applications authorized to access organizational data. ` +
       `Of these, ${critHighApps.length} are rated Critical or High risk and require immediate IT review.`,
       M, y, { width: W - M * 2 });

  y = doc.y + 20;

  // Stats table
  const statRows = [
    ['Total applications discovered', totalApps, ''],
    ['Critical risk applications', counts.critical, counts.critical > 0 ? '⚠ Action required' : ''],
    ['High risk applications', counts.high, counts.high > 0 ? '⚠ Review recommended' : ''],
    ['Applications with admin access', adminScopeApps.length, adminScopeApps.length > 0 ? '⚠ Elevated privilege' : ''],
    ['Applications accessing email', emailApps.length, ''],
    ['Applications accessing files/Drive', driveApps.length, ''],
    ['Unverified publishers', unverifiedApps.length, unverifiedApps.length > 0 ? '⚠ Verify publisher identity' : ''],
    ['AI tools detected', aiTools.length, aiTools.length > 0 ? 'Review data handling' : ''],
    ['Approved / whitelisted', whitelist.length, ''],
  ];

  y = drawTable(doc, {
    x: M, y,
    colWidths: [W - M * 2 - 180 - 120, 80, 120],
    headers: ['Metric', 'Count', 'Status'],
    rows: statRows,
    rowHeight: 26,
  });

  // Risk distribution
  y += 20;
  doc.fillColor(C.text).fontSize(12).font('Helvetica-Bold').text('Risk Distribution', M, y);
  y += 20;

  const riskRows = [
    ['Critical', counts.critical, totalApps > 0 ? `${Math.round(counts.critical / totalApps * 100)}%` : '0%', 'Immediate review required'],
    ['High',     counts.high,     totalApps > 0 ? `${Math.round(counts.high / totalApps * 100)}%` : '0%', 'Review within 7 days'],
    ['Medium',   counts.medium,   totalApps > 0 ? `${Math.round(counts.medium / totalApps * 100)}%` : '0%', 'Review within 30 days'],
    ['Low',      counts.low,      totalApps > 0 ? `${Math.round(counts.low / totalApps * 100)}%` : '0%', 'Monitor'],
  ];

  drawTable(doc, {
    x: M, y,
    colWidths: [120, 80, 80, W - M * 2 - 280],
    headers: ['Risk Level', 'Count', 'Percentage', 'Recommended Action'],
    rows: riskRows,
    riskCol: 0,
  });

  pageFooter(doc, workspace.name, W);

  // ── PAGE 3: CRITICAL & HIGH RISK APPS ──────────────────────────────────────
  doc.addPage();
  pageHeader(doc, 'Critical & High Risk Applications', W, M);

  y = 110;
  doc.fillColor(C.text).fontSize(10).font('Helvetica').lineGap(4)
     .text(`The following ${critHighApps.length} application${critHighApps.length !== 1 ? 's' : ''} have been rated Critical or High risk ` +
       `and require immediate IT review. Each represents significant exposure through broad OAuth scopes, ` +
       `unverified publishers, or sensitive data access.`,
       M, y, { width: W - M * 2 });
  y = doc.y + 16;

  const riskRows2 = critHighApps.slice(0, 20).map(a => [
    a.app_name.length > 22 ? a.app_name.substring(0, 20) + '…' : a.app_name,
    a.source,
    a.risk_level.toUpperCase(),
    String(a.risk_score),
    a.has_admin_scope ? 'Yes' : 'No',
    a.accesses_email ? 'Yes' : 'No',
    a.is_ai_tool ? 'Yes' : 'No',
    a.is_verified ? 'Yes' : 'No',
  ]);

  drawTable(doc, {
    x: M, y,
    colWidths: [130, 60, 60, 42, 55, 55, 42, 46],
    headers: ['App Name', 'Source', 'Risk', 'Score', 'Admin', 'Email', 'AI', 'Verified'],
    rows: riskRows2,
    riskCol: 2,
    rowHeight: 22,
    fontSize: 8.5,
  });

  pageFooter(doc, workspace.name, W);

  // ── PAGE 4: AI TOOLS ────────────────────────────────────────────────────────
  doc.addPage();
  pageHeader(doc, 'AI Tool Risk Analysis', W, M);

  y = 110;
  if (aiTools.length === 0) {
    doc.fillColor(C.gray).fontSize(11).font('Helvetica')
       .text('No AI tools were detected in this scan.', M, y);
  } else {
    doc.fillColor(C.text).fontSize(10).font('Helvetica').lineGap(4)
       .text(`${aiTools.length} AI tool${aiTools.length !== 1 ? 's' : ''} were detected. AI tools present unique data privacy risks: ` +
         `they may process sensitive organizational data, retain it for model training, or transfer it to servers outside your jurisdiction. ` +
         `Review data processing agreements (DPAs) for each tool.`,
         M, y, { width: W - M * 2 });
    y = doc.y + 16;

    const aiRows = aiTools.map(a => {
      const flags = a.ai_risk_flags || {};
      return [
        a.app_name.length > 18 ? a.app_name.substring(0, 16) + '…' : a.app_name,
        a.source,
        String(a.user_count),
        flags.data_training_clause ? 'Yes' : 'No',
        flags.trains_on_data ? 'Yes' : 'No',
        flags.data_retention || 'Unknown',
        flags.server_geography || 'Unknown',
      ];
    });

    drawTable(doc, {
      x: M, y,
      colWidths: [110, 60, 44, 75, 65, 100, W - M * 2 - 110 - 60 - 44 - 75 - 65 - 100],
      headers: ['AI Tool', 'Source', 'Users', 'Training Clause', 'Trains on Data', 'Data Retention', 'Geography'],
      rows: aiRows,
      rowHeight: 24,
      fontSize: 8.5,
    });

    y = doc.y + 20;
    doc.fillColor(C.text).fontSize(11).font('Helvetica-Bold').text('AI Tool Risk Recommendations', M, y);
    y += 16;
    const recs = [
      'Review data processing agreements (DPAs) for all AI tools with direct email or file access.',
      'Disable training on organizational data in tool settings where available (e.g., ChatGPT Team, Microsoft Copilot).',
      'Ensure AI tools with sensitive scopes are approved through the official IT procurement process.',
      'For GDPR compliance, verify that AI vendors are EU-based or have adequate data transfer mechanisms (SCCs, BCRs).',
    ];
    recs.forEach(r => {
      if (y > doc.page.height - 100) { doc.addPage(); pageHeader(doc, 'AI Tool Risk Analysis (cont.)', W, M); y = 110; }
      doc.fillColor(C.text).fontSize(9).font('Helvetica')
         .text(`• ${r}`, M + 10, y, { width: W - M * 2 - 10, lineGap: 2 });
      y = doc.y + 8;
    });
  }

  pageFooter(doc, workspace.name, W);

  // ── PAGE 5: APPROVED APPS & COMPLIANCE NOTES ───────────────────────────────
  doc.addPage();
  pageHeader(doc, 'Approved Applications & Compliance Framework', W, M);

  y = 110;
  doc.fillColor(C.text).fontSize(12).font('Helvetica-Bold').text('Approved Applications', M, y);
  y += 14;

  if (whitelist.length === 0) {
    doc.fillColor(C.gray).fontSize(10).font('Helvetica')
       .text('No applications have been approved yet. Use the dashboard to review and approve apps.', M, y);
    y += 30;
  } else {
    const wlRows = whitelist.map(w => [
      w.app_name.length > 28 ? w.app_name.substring(0, 26) + '…' : w.app_name,
      w.source || '—',
      w.approved_by || '—',
      w.created_at ? new Date(w.created_at).toLocaleDateString() : '—',
    ]);
    y = drawTable(doc, {
      x: M, y,
      colWidths: [200, 80, 140, W - M * 2 - 420],
      headers: ['Application', 'Source', 'Approved By', 'Date'],
      rows: wlRows,
      rowHeight: 22,
      fontSize: 9,
    });
    y += 20;
  }

  // Compliance framework section
  if (y > doc.page.height - 250) { doc.addPage(); pageHeader(doc, 'Compliance Framework Notes', W, M); y = 110; }

  doc.fillColor(C.text).fontSize(12).font('Helvetica-Bold').text('Compliance Framework Mapping', M, y);
  y += 14;

  const frameworks = [
    {
      name: 'SOC 2 Type II',
      color: C.brand,
      controls: [
        'CC6.1 — Logical and Physical Access Controls: Documents all third-party apps with OAuth access to organizational systems.',
        'CC6.3 — Remote Access: Identifies shadow applications operating outside of approved IT channels.',
        'CC6.6 — Logical Access Restrictions: Flags applications with admin-level scopes requiring additional controls.',
        'CC9.2 — Vendor Risk Management: Supports assessment of third-party application risk and vendor verification status.',
      ],
    },
    {
      name: 'ISO 27001:2022',
      color: C.medium,
      controls: [
        'A.5.23 — Information Security for Use of Cloud Services: Inventories all cloud services in use, authorized or not.',
        'A.8.1 — Asset Management: Provides a complete register of software assets accessing organizational data.',
        'A.9.2 — User Access Management: Identifies over-privileged applications with unnecessary scope grants.',
        'A.5.19 — Information Security in Supplier Relationships: Documents third-party app publishers and verification status.',
      ],
    },
    {
      name: 'GDPR (EU 2016/679)',
      color: C.high,
      controls: [
        'Art. 30 — Records of Processing Activities: This report supports documentation of data processing through third-party apps.',
        'Art. 25 — Data Protection by Design: Identifies apps accessing personal data (email, calendar, files) beyond necessity.',
        'Art. 28 — Processor Obligations: Flags AI tools with data training clauses that may act as data processors.',
        'Art. 44 — Transfers to Third Countries: Highlights apps with unknown server geography that may transfer EU data.',
      ],
    },
  ];

  frameworks.forEach(fw => {
    if (y > doc.page.height - 130) { doc.addPage(); y = M + 20; }
    const [r, g, b] = hex2rgb(fw.color);
    doc.rect(M, y, W - M * 2, 22).fill(fw.color);
    doc.fillColor(C.white).fontSize(10).font('Helvetica-Bold').text(fw.name, M + 12, y + 5);
    y += 22;
    fw.controls.forEach(ctrl => {
      if (y > doc.page.height - 60) { doc.addPage(); y = M + 20; }
      doc.rect(M, y, W - M * 2, 1).fill('#e2e8f0');
      doc.fillColor(C.text).fontSize(8.5).font('Helvetica')
         .text(ctrl, M + 12, y + 5, { width: W - M * 2 - 24, lineGap: 1 });
      y = doc.y + 9;
    });
    y += 12;
  });

  pageFooter(doc, workspace.name, W);

  // Back page
  doc.addPage();
  doc.rect(0, 0, W, doc.page.height).fill(C.dark);
  doc.rect(0, 0, 6, doc.page.height).fill(C.brand);
  doc.fillColor(C.white).fontSize(20).font('Helvetica-Bold')
     .text('Shadow IT Scanner', M + 20, doc.page.height / 2 - 40, { align: 'center', width: W - M * 2 });
  doc.fillColor(C.light).fontSize(11).font('Helvetica')
     .text('Automated shadow IT discovery and compliance reporting.', M + 20, doc.page.height / 2,
       { align: 'center', width: W - M * 2 });
  doc.fillColor(C.gray).fontSize(9)
     .text(`Report generated ${dateStr}  ·  ${workspace.name}  ·  CONFIDENTIAL`,
       0, doc.page.height - 50, { align: 'center', width: W });
}

function pageHeader(doc, title, W, M) {
  doc.rect(0, 0, W, 80).fill(C.dark);
  doc.rect(0, 0, 6, 80).fill(C.brand);
  doc.fillColor(C.brand).fontSize(8).font('Helvetica-Bold')
     .text('SHADOW IT SCANNER  ·  COMPLIANCE REPORT', M + 10, 20, { characterSpacing: 1.5 });
  doc.fillColor(C.white).fontSize(18).font('Helvetica-Bold')
     .text(title, M + 10, 38);
  doc.y = 95;
}

function pageFooter(doc, orgName, W) {
  const pageNum = doc.bufferedPageRange().count;
  doc.fillColor(C.light).fontSize(7.5).font('Helvetica')
     .text(`${orgName}  ·  Shadow IT Compliance Report  ·  CONFIDENTIAL  ·  Page ${pageNum}`,
       0, doc.page.height - 30, { align: 'center', width: W });
}

function drawTable(doc, { x, y, colWidths, headers, rows, riskCol, rowHeight = 26, fontSize = 9 }) {
  const totalW = colWidths.reduce((s, w) => s + w, 0);
  const headerH = 26;

  // Header row
  doc.rect(x, y, totalW, headerH).fill(C.slate);
  let cx = x;
  headers.forEach((h, i) => {
    doc.fillColor(C.light).fontSize(fontSize - 0.5).font('Helvetica-Bold')
       .text(h.toUpperCase(), cx + 8, y + 8, { width: colWidths[i] - 16, ellipsis: true });
    cx += colWidths[i];
  });
  y += headerH;

  // Data rows
  rows.forEach((row, ri) => {
    const rh = rowHeight;
    const bg = ri % 2 === 0 ? '#f8fafc' : C.white;
    doc.rect(x, y, totalW, rh).fill(bg).stroke('#e2e8f0');

    cx = x;
    row.forEach((cell, ci) => {
      let color = C.text;
      if (ci === riskCol) {
        const lvl = String(cell).toLowerCase();
        color = RISK_COLOR[lvl] || C.text;
      }
      // Highlight warning cells
      if (String(cell) === 'Yes' && (ci === 4 || ci === 5)) color = C.high; // admin/email access
      if (String(cell) === 'Yes' && ci === 6 && headers[ci] === 'AI') color = '#7c3aed';

      doc.fillColor(color).fontSize(fontSize).font(ci === riskCol ? 'Helvetica-Bold' : 'Helvetica')
         .text(String(cell), cx + 8, y + (rh - fontSize * 1.2) / 2, {
           width: colWidths[ci] - 16,
           ellipsis: true,
           lineBreak: false,
         });
      cx += colWidths[ci];
    });
    y += rh;
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 90;
    }
  });
  doc.y = y;
  return y;
}

async function generateReport(req, res, next) {
  try {
    const { workspace_id } = req.query;
    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const [apps, whitelist, scanRun] = await Promise.all([
      DiscoveredApp.findAll({
        where: { workspace_id },
        order: [['risk_score', 'DESC']],
        limit: 500,
      }),
      WhitelistedApp.findAll({ where: { workspace_id } }),
      ScanRun.findOne({ where: { workspace_id, status: 'completed' }, order: [['completed_at', 'DESC']] }),
    ]);

    // Deduplicate by app_id
    const seen = new Set();
    const unique = [];
    for (const a of apps) { if (!seen.has(a.app_id)) { seen.add(a.app_id); unique.push(a); } }

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of unique) counts[a.risk_level] = (counts[a.risk_level] || 0) + 1;

    const aiTools = unique.filter(a => a.is_ai_tool);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true,
      info: {
        Title: `Shadow IT Compliance Report — ${ws.name}`,
        Author: 'Shadow IT Scanner',
        Subject: 'Shadow IT Compliance Report',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="shadow-it-compliance-${new Date().toISOString().split('T')[0]}.pdf"`);

    doc.pipe(res);
    buildPDF(doc, { workspace: ws, apps: unique, whitelist, scanRun, counts, aiTools });
    doc.end();
  } catch (err) { next(err); }
}

module.exports = { generateReport };
