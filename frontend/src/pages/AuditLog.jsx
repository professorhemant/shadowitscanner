import { useState, useEffect, useCallback } from 'react';
import { listWorkspaces } from '../api/workspaces';
import { listAuditLogs, exportAuditCsv, getAuditActionTypes } from '../api/audit';

const ACTION_ICONS = {
  'app.whitelist':   { icon: '✅', color: 'text-emerald-400', label: 'App Approved' },
  'app.unwhitelist': { icon: '🚫', color: 'text-red-400',     label: 'Approval Removed' },
  'policy.create':   { icon: '📋', color: 'text-brand-400',   label: 'Policy Created' },
  'policy.delete':   { icon: '🗑️', color: 'text-orange-400',  label: 'Policy Deleted' },
  'team.invite':     { icon: '📬', color: 'text-violet-400',   label: 'Team Invite Sent' },
  'team.revoke':     { icon: '🔒', color: 'text-red-400',      label: 'Access Revoked' },
  'scan.start':      { icon: '🔍', color: 'text-blue-400',     label: 'Scan Started' },
};

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

function ActionBadge({ action }) {
  const meta = ACTION_ICONS[action] || { icon: '•', color: 'text-slate-400', label: action };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.color}`}>
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

const PAGE_SIZE = 50;

export default function AuditLog() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWs, setSelectedWs] = useState('');
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filterAction, setFilterAction] = useState('');
  const [filterActor, setFilterActor] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [actionTypes, setActionTypes] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    listWorkspaces().then(r => {
      const ws = r.data.workspaces || [];
      setWorkspaces(ws);
      if (ws.length) setSelectedWs(ws[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedWs) return;
    getAuditActionTypes(selectedWs).then(r => setActionTypes(r.data.actions || [])).catch(() => {});
  }, [selectedWs]);

  const load = useCallback((wsId, pg = 0) => {
    if (!wsId) return;
    setLoading(true);
    const params = {
      workspace_id: wsId,
      limit: PAGE_SIZE,
      offset: pg * PAGE_SIZE,
    };
    if (filterAction) params.action = filterAction;
    if (filterActor) params.actor_email = filterActor;
    if (filterFrom) params.from = filterFrom;
    if (filterTo) params.to = filterTo;

    listAuditLogs(params)
      .then(r => { setLogs(r.data.logs || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedWs, filterAction, filterActor, filterFrom, filterTo]);

  useEffect(() => {
    setPage(0);
    load(selectedWs, 0);
  }, [selectedWs, filterAction, filterActor, filterFrom, filterTo]);

  function handlePageChange(dir) {
    const np = page + dir;
    setPage(np);
    load(selectedWs, np);
  }

  async function handleExport() {
    if (!selectedWs) return;
    setExporting(true);
    try {
      const r = await exportAuditCsv(selectedWs);
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${selectedWs}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { } finally { setExporting(false); }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-slate-400 text-sm mt-1">
            Chronological record of all actions taken in your workspace — required for SOC 2 &amp; ISO 27001 compliance.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !selectedWs}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg border border-slate-600 transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : '⬇ Export CSV'}
        </button>
      </div>

      {/* Workspace selector */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <select
          value={selectedWs}
          onChange={e => { setSelectedWs(e.target.value); setPage(0); }}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          {workspaces.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
        </select>
      </div>

      {/* Filters */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Action</label>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
            >
              <option value="">All actions</option>
              {actionTypes.map(a => (
                <option key={a} value={a}>{ACTION_ICONS[a]?.label || a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Actor email</label>
            <input
              type="text"
              value={filterActor}
              onChange={e => setFilterActor(e.target.value)}
              placeholder="e.g. alice@"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">From date</label>
            <input
              type="date"
              value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">To date</label>
            <input
              type="date"
              value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        {(filterAction || filterActor || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterAction(''); setFilterActor(''); setFilterFrom(''); setFilterTo(''); }}
            className="mt-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Log table */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {loading ? 'Loading…' : `${total.toLocaleString()} event${total !== 1 ? 's' : ''}`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={() => handlePageChange(-1)}
                disabled={page === 0}
                className="px-2 py-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                ← Prev
              </button>
              <span>{page + 1} / {totalPages}</span>
              <button
                onClick={() => handlePageChange(1)}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {logs.length === 0 && !loading ? (
          <div className="px-5 py-14 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-white font-medium">No audit events yet</div>
            <div className="text-slate-400 text-sm mt-1">
              Events are recorded as you approve apps, manage team members, create policies, and run scans.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                {/* Icon */}
                <div className="shrink-0 mt-0.5 w-7 text-center text-lg">
                  {ACTION_ICONS[log.action]?.icon || '•'}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ActionBadge action={log.action} />
                    {log.resource_name && (
                      <span className="text-xs text-slate-300 font-medium truncate max-w-xs">
                        — {log.resource_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">
                      {log.actor_name
                        ? <><span className="text-slate-200">{log.actor_name}</span> · {log.actor_email}</>
                        : <span className="text-slate-500">system</span>}
                    </span>
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <span className="text-xs text-slate-500 font-mono truncate max-w-sm">
                        {Object.entries(log.meta)
                          .filter(([, v]) => v !== null && v !== undefined && v !== '')
                          .map(([k, v]) => `${k}=${v}`)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="shrink-0 text-xs text-slate-500 whitespace-nowrap mt-0.5">
                  {fmtDate(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOC 2 callout */}
      <div className="bg-brand-900/20 border border-brand-700/30 rounded-xl px-5 py-4 flex items-start gap-3">
        <span className="text-xl shrink-0">🛡️</span>
        <div>
          <div className="text-sm font-semibold text-brand-300">Compliance-ready audit trail</div>
          <div className="text-xs text-slate-400 mt-0.5">
            This log records who did what and when across your workspace. It satisfies the audit trail requirements for
            <strong className="text-slate-300"> SOC 2 Type II (CC6.2, CC6.3)</strong>,
            <strong className="text-slate-300"> ISO 27001 (A.12.4.1)</strong>, and
            <strong className="text-slate-300"> GDPR Article 25</strong>.
            Export CSV for auditor review.
          </div>
        </div>
      </div>
    </div>
  );
}
