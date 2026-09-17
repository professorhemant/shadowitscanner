'use strict';

const { Workspace, ScanRun, DiscoveredApp } = require('../models');
const { persistScanResults } = require('./scanController');

async function upload(req, res, next) {
  try {
    const { results, cli_version } = req.body;
    if (!results?.length) return res.status(400).json({ message: 'No results provided' });

    // Use first workspace belonging to user (CLI doesn't have workspace concept)
    let ws = await Workspace.findOne({ where: { user_id: req.user.id }, order: [['created_at', 'ASC']] });
    if (!ws) {
      // Auto-create a "CLI Upload" workspace
      ws = await Workspace.create({
        user_id: req.user.id,
        name: 'CLI Upload',
        type: results[0]?.source || 'slack',
      });
    }

    const allApps = results.flatMap(r => r.apps || []);
    const source = results.length > 1 ? 'both' : (results[0]?.source || 'slack');

    const run = await ScanRun.create({
      workspace_id: ws.id,
      triggered_by: 'cli',
      source,
      status: 'running',
      started_at: new Date(),
    });

    await persistScanResults(ws.id, source, allApps, 'cli', run.id);

    res.json({
      scan_id: run.id,
      url: `${process.env.FRONTEND_URL || 'https://shadowit.app'}/scans/${run.id}`,
      message: `Uploaded ${allApps.length} apps`,
    });
  } catch (err) { next(err); }
}

module.exports = { upload };
