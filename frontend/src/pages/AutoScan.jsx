import { useState, useEffect, useCallback } from 'react';
import { listWorkspaces } from '../api/workspaces';
import { getSchedule, updateSchedule } from '../api/schedule';
import { triggerScan } from '../api/scans';

const FREQUENCIES = [
  { value: 'off',     label: 'Off',     desc: 'Manual scans only' },
  { value: 'daily',   label: 'Daily',   desc: 'Every day at chosen hour' },
  { value: 'weekly',  label: 'Weekly',  desc: 'Once a week on chosen day' },
  { value: 'monthly', label: 'Monthly', desc: 'Once a month on chosen date' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 UTC`,
}));

const WEEKDAYS = [
  { value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' }, { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${[,'st','nd','rd'][((i+1)%100<11||(i+1)%100>13)&&(i+1)%10<4?(i+1)%10:0]||'th'} of month`,
}));

const STATUS_BADGE = {
  completed: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/30',
  failed:    'bg-red-900/40 text-red-400 border border-red-700/30',
  running:   'bg-blue-900/40 text-blue-400 border border-blue-700/30',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
}

function NextRunBadge({ nextRun, frequency }) {
  if (frequency === 'off' || !nextRun) return null;
  const diff = new Date(nextRun) - Date.now();
  const hours = Math.max(0, Math.floor(diff / 3600000));
  const mins  = Math.max(0, Math.floor((diff % 3600000) / 60000));
  const label = diff < 0 ? 'overdue' : hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;
  return (
    <span className="ml-2 text-xs bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
}

export default function AutoScan() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWs, setSelectedWs] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [form, setForm] = useState({ schedule_frequency: 'off', schedule_hour: 9, schedule_day: 1, schedule_notify_email: '' });
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    listWorkspaces().then(r => {
      setWorkspaces(r.data.workspaces || []);
      if (r.data.workspaces?.length) setSelectedWs(r.data.workspaces[0].id);
    }).catch(() => {});
  }, []);

  const loadSchedule = useCallback((wsId) => {
    if (!wsId) return;
    getSchedule(wsId).then(r => {
      setSchedule(r.data);
      setForm({
        schedule_frequency:    r.data.schedule_frequency || 'off',
        schedule_hour:         r.data.schedule_hour ?? 9,
        schedule_day:          r.data.schedule_day ?? 1,
        schedule_notify_email: r.data.schedule_notify_email || '',
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { loadSchedule(selectedWs); }, [selectedWs, loadSchedule]);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSchedule(selectedWs, form);
      flash('Schedule saved.');
      setSchedule(prev => ({ ...prev, ...form, schedule_next_run: res.data.schedule_next_run }));
    } catch (err) {
      flash(err.response?.data?.message || 'Save failed', false);
    } finally { setSaving(false); }
  }

  async function handleRunNow() {
    if (!selectedWs || scanning) return;
    setScanning(true);
    try {
      await triggerScan(selectedWs, ws?.type);
      flash('Scan started. Check Scan History for results.');
    } catch (err) {
      flash(err.response?.data?.message || 'Scan failed', false);
    } finally { setScanning(false); }
  }

  const ws = workspaces.find(w => w.id === selectedWs);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Auto-Scan Schedule</h1>
          <p className="text-slate-400 text-sm mt-1">Run scans automatically — continuous monitoring without manual intervention.</p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={!selectedWs || scanning}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {scanning ? '⟳ Running…' : '▶ Run Now'}
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${msg.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
          {msg.text}
        </div>
      )}

      {/* Workspace selector */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Workspace</label>
        <select
          value={selectedWs}
          onChange={e => setSelectedWs(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
          ))}
        </select>
      </div>

      {/* Schedule form */}
      <form onSubmit={handleSave} className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-5">
        <h2 className="text-base font-semibold text-white">Schedule Configuration</h2>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Frequency</label>
          <div className="grid grid-cols-4 gap-2">
            {FREQUENCIES.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, schedule_frequency: f.value }))}
                className={`p-3 rounded-lg border text-sm transition-colors text-left ${
                  form.schedule_frequency === f.value
                    ? 'border-brand-500 bg-brand-900/20 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="font-medium">{f.label}</div>
                <div className="text-xs opacity-60 mt-0.5">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {form.schedule_frequency !== 'off' && (
          <div className="grid grid-cols-2 gap-4">
            {/* Hour */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Run at (UTC)</label>
              <select
                value={form.schedule_hour}
                onChange={e => setForm(p => ({ ...p, schedule_hour: Number(e.target.value) }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
              >
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>

            {/* Day picker (weekly or monthly) */}
            {form.schedule_frequency === 'weekly' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Day of Week</label>
                <select
                  value={form.schedule_day}
                  onChange={e => setForm(p => ({ ...p, schedule_day: Number(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  {WEEKDAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}
            {form.schedule_frequency === 'monthly' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Day of Month</label>
                <select
                  value={form.schedule_day}
                  onChange={e => setForm(p => ({ ...p, schedule_day: Number(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  {MONTH_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {form.schedule_frequency !== 'off' && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Notify email (optional — alerts on critical/high findings)
            </label>
            <input
              type="email"
              value={form.schedule_notify_email}
              onChange={e => setForm(p => ({ ...p, schedule_notify_email: e.target.value }))}
              placeholder="it-alerts@company.com"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        )}

        {/* Next run preview */}
        {schedule && form.schedule_frequency !== 'off' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-sm">
            <span className="text-slate-400">Next run:</span>
            <span className="text-white ml-2 font-medium">{fmtDate(schedule.schedule_next_run)}</span>
            <NextRunBadge nextRun={schedule.schedule_next_run} frequency={schedule.schedule_frequency} />
            {schedule.last_scan_at && (
              <span className="ml-4 text-slate-400">Last scan: <span className="text-slate-300">{fmtDate(schedule.last_scan_at)}</span></span>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </form>

      {/* Recent auto-scans */}
      {schedule?.recent_scans?.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h2 className="text-base font-semibold text-white">Recent Auto-Scans</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-surface-border">
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Apps</th>
                <th className="px-5 py-3">Critical</th>
                <th className="px-5 py-3">High</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.recent_scans.map(run => (
                <tr key={run.id} className="border-b border-surface-border/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-slate-300">{fmtDate(run.started_at)}</td>
                  <td className="px-5 py-3 text-white font-medium">{run.apps_found ?? '—'}</td>
                  <td className="px-5 py-3">
                    {run.critical_count > 0
                      ? <span className="font-semibold text-red-400">{run.critical_count}</span>
                      : <span className="text-slate-500">0</span>}
                  </td>
                  <td className="px-5 py-3">
                    {run.high_count > 0
                      ? <span className="font-semibold text-orange-400">{run.high_count}</span>
                      : <span className="text-slate-500">0</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[run.status] || 'text-slate-400'}`}>
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {schedule?.recent_scans?.length === 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-white font-medium">No auto-scans yet</div>
          <div className="text-slate-400 text-sm mt-1">
            {form.schedule_frequency === 'off'
              ? 'Set a schedule above to enable automatic scanning.'
              : `First scan will run at ${fmtDate(schedule?.schedule_next_run)}`}
          </div>
        </div>
      )}
    </div>
  );
}
