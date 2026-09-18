'use strict';

const { Workspace, ScanRun } = require('../models');
const { computeNextRun } = require('../services/scanScheduleService');

const VALID_FREQUENCIES = ['off', 'daily', 'weekly', 'monthly'];

async function getSchedule(req, res, next) {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ message: 'workspace_id required' });

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    const recentScans = await ScanRun.findAll({
      where: { workspace_id, triggered_by: 'scheduled' },
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: ['id', 'status', 'apps_found', 'critical_count', 'high_count', 'started_at', 'completed_at'],
    });

    res.json({
      workspace_id: ws.id,
      workspace_name: ws.name,
      workspace_type: ws.type,
      schedule_frequency: ws.schedule_frequency || 'off',
      schedule_hour: ws.schedule_hour ?? 9,
      schedule_day: ws.schedule_day ?? 1,
      schedule_next_run: ws.schedule_next_run,
      schedule_notify_email: ws.schedule_notify_email || '',
      last_scan_at: ws.last_scan_at,
      recent_scans: recentScans,
    });
  } catch (err) { next(err); }
}

async function updateSchedule(req, res, next) {
  try {
    const { workspace_id } = req.params;
    const { schedule_frequency, schedule_hour, schedule_day, schedule_notify_email } = req.body;

    const ws = await Workspace.findOne({ where: { id: workspace_id, user_id: req.user.id } });
    if (!ws) return res.status(404).json({ message: 'Workspace not found' });

    if (schedule_frequency && !VALID_FREQUENCIES.includes(schedule_frequency)) {
      return res.status(400).json({ message: 'Invalid frequency' });
    }

    const freq = schedule_frequency ?? ws.schedule_frequency;
    const hour = schedule_hour !== undefined ? Number(schedule_hour) : (ws.schedule_hour ?? 9);
    const day  = schedule_day  !== undefined ? Number(schedule_day)  : (ws.schedule_day  ?? 1);

    const nextRun = freq === 'off' ? null : computeNextRun(freq, hour, day);

    await ws.update({
      schedule_frequency: freq,
      schedule_hour: hour,
      schedule_day: day,
      schedule_next_run: nextRun,
      schedule_notify_email: schedule_notify_email !== undefined
        ? (schedule_notify_email || null)
        : ws.schedule_notify_email,
    });

    res.json({
      message: 'Schedule updated',
      schedule_frequency: freq,
      schedule_next_run: nextRun,
    });
  } catch (err) { next(err); }
}

module.exports = { getSchedule, updateSchedule };
