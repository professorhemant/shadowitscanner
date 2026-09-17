import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listApps, whitelistApp, removeWhitelist } from '../api/apps';
import { useWorkspaceStore } from '../store/workspaceStore';
import RiskBadge from '../components/apps/RiskBadge';
import AppDetailModal from '../components/apps/AppDetailModal';

const LEVELS = ['', 'critical', 'high', 'medium', 'low'];

export default function AppInventory() {
  const { activeWorkspace } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['apps', activeWorkspace?.id, search, riskFilter, sourceFilter, page],
    queryFn: () => listApps({
      workspace_id: activeWorkspace?.id,
      search: search || undefined,
      risk_level: riskFilter || undefined,
      source: sourceFilter || undefined,
      page, limit: 50, sort: 'risk_score', order: 'DESC',
    }).then(r => r.data),
  });

  const wlMutation = useMutation({
    mutationFn: (app) => app.is_whitelisted ? removeWhitelist(app.id) : whitelistApp(app.id),
    onSuccess: () => qc.invalidateQueries(['apps']),
  });

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">App Inventory</h1>
        <span className="text-slate-400 text-sm">{data?.total ?? '…'} total apps</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search apps…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500 w-52"
        />
        <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
          className="bg-surface-card border border-surface-border text-sm text-slate-300 px-3 py-2 rounded-lg focus:outline-none">
          <option value="">All risk levels</option>
          {['critical','high','medium','low'].map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
        </select>
        <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
          className="bg-surface-card border border-surface-border text-sm text-slate-300 px-3 py-2 rounded-lg focus:outline-none">
          <option value="">All sources</option>
          <option value="slack">Slack</option>
          <option value="google">Google</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['App Name','Source','Risk','Score','Users','Verified',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : data?.apps?.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No apps found</td></tr>
            ) : data?.apps?.map(app => (
              <tr key={app.id} className="border-b border-surface-border/50 hover:bg-slate-700/20 cursor-pointer"
                onClick={() => setSelected(app)}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-200 truncate max-w-[200px]">{app.app_name}</div>
                  {app.is_whitelisted && <span className="text-xs text-green-400">✓ whitelisted</span>}
                </td>
                <td className="px-4 py-3 text-slate-400 capitalize">{app.source}</td>
                <td className="px-4 py-3"><RiskBadge level={app.risk_level} /></td>
                <td className="px-4 py-3 font-bold text-slate-200">{app.risk_score}</td>
                <td className="px-4 py-3 text-slate-400">{app.user_count}</td>
                <td className="px-4 py-3">{app.is_verified ? <span className="text-green-400">✔</span> : <span className="text-red-400">✖</span>}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => wlMutation.mutate(app)}
                    className={`text-xs px-2 py-1 rounded font-medium transition-colors ${app.is_whitelisted ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-green-600/20 text-green-400 hover:bg-green-600/40'}`}>
                    {app.is_whitelisted ? 'Remove' : 'Approve'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > 50 && (
        <div className="flex items-center gap-3 justify-end">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm bg-surface-card border border-surface-border rounded-lg text-slate-400 disabled:opacity-40">← Prev</button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= data.total}
            className="px-3 py-1.5 text-sm bg-surface-card border border-surface-border rounded-lg text-slate-400 disabled:opacity-40">Next →</button>
        </div>
      )}

      <AppDetailModal app={selected} onClose={() => setSelected(null)} onWhitelist={app => { wlMutation.mutate(app); setSelected(null); }} />
    </div>
  );
}
