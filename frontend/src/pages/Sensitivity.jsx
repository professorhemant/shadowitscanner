import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getSensitivity } from '../api/sensitivity';

const SENSITIVITY_STYLES = {
  critical: { badge: 'bg-red-500/20 text-red-300 border border-red-600/40', bar: 'bg-red-500', dot: 'bg-red-400', tile: 'bg-red-900/20 border-red-700/30 text-red-400' },
  high:     { badge: 'bg-orange-500/20 text-orange-300 border border-orange-600/40', bar: 'bg-orange-500', dot: 'bg-orange-400', tile: 'bg-orange-900/20 border-orange-700/30 text-orange-400' },
  medium:   { badge: 'bg-blue-500/20 text-blue-300 border border-blue-600/40', bar: 'bg-blue-500', dot: 'bg-blue-400', tile: 'bg-blue-900/20 border-blue-700/30 text-blue-400' },
  low:      { badge: 'bg-green-500/20 text-green-300 border border-green-600/40', bar: 'bg-green-500', dot: 'bg-green-400', tile: 'bg-green-900/20 border-green-700/30 text-green-400' },
};

const VIA_LABEL = { scope: 'OAuth scope', flag: 'scope flag', name: 'app category' };

function ExposureChip({ exposure }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/40 text-slate-300">
      <span>{exposure.icon}</span>
      {exposure.label}
    </span>
  );
}

function AppRow({ app }) {
  const [expanded, setExpanded] = useState(false);
  const style = SENSITIVITY_STYLES[app.sensitivity_level] || SENSITIVITY_STYLES.low;

  if (app.exposure_count === 0) return null;

  return (
    <div className="border-b border-surface-border last:border-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 py-3 text-left hover:bg-slate-800/30 transition-colors px-4"
      >
        <div className={`shrink-0 mt-1 w-2 h-2 rounded-full ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{app.app_name}</span>
            {app.is_ai_tool && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">AI</span>
            )}
            {app.amplified_by_ai && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/40">⚠ AI+Data</span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.badge}`}>
              {app.sensitivity_level.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-500">{app.source}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {app.exposures.map(e => <ExposureChip key={e.key} exposure={e} />)}
          </div>
        </div>
        <span className="shrink-0 text-slate-600 text-xs mt-0.5">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 bg-slate-800/20">
          <div className="text-xs text-slate-500 mb-2">Developer: {app.developer || '—'} · Risk score: {app.risk_score} · Users: {app.user_count || 1}</div>
          <div className="space-y-2">
            {app.exposures.map(e => (
              <div key={e.key} className="flex items-start gap-2 text-xs">
                <span className="text-base w-5 text-center shrink-0">{e.icon}</span>
                <div>
                  <span className="text-white font-medium">{e.label}</span>
                  <span className="text-slate-500 ml-1.5">via {VIA_LABEL[e.via] || e.via}</span>
                  <div className="text-slate-500 mt-0.5">{e.description}</div>
                </div>
              </div>
            ))}
            {app.amplified_by_ai && (
              <div className="flex items-start gap-2 text-xs mt-2 p-2 bg-red-900/20 border border-red-700/30 rounded-lg">
                <span className="text-base">⚠️</span>
                <div className="text-red-300">
                  <strong>AI Amplification Risk:</strong> This AI tool has access to organizational data. Data may be used for model training or retained beyond your control.
                  {app.ai_risk_flags?.data_training_clause && (
                    <div className="mt-0.5 text-red-400/80">Training clause: {app.ai_risk_flags.data_training_clause}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sensitivity() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    getSensitivity(activeWorkspace.id)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const filteredApps = data?.apps?.filter(a => {
    if (filter === 'all') return a.exposure_count > 0;
    if (filter === 'ai') return a.amplified_by_ai;
    return a.sensitivity_level === filter;
  }) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Data Sensitivity</h1>
        <p className="text-slate-400 text-sm mt-1">
          Scope-based classification of what organizational data each app can access — no actual data is scanned.
        </p>
      </div>

      {!activeWorkspace && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5 text-amber-300 text-sm">
          Select a workspace to see data sensitivity analysis.
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">🔍</div>
          <div>Classifying data exposures…</div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Critical Exposure', value: data.summary.critical_count, style: SENSITIVITY_STYLES.critical },
              { label: 'High Exposure', value: data.summary.high_count, style: SENSITIVITY_STYLES.high },
              { label: 'AI + Data Access', value: data.summary.ai_with_data_access, style: { tile: 'bg-purple-900/20 border-purple-700/30 text-purple-400' } },
              { label: 'No Data Exposure', value: data.summary.clean_apps, style: SENSITIVITY_STYLES.low },
            ].map(s => (
              <div key={s.label} className={`border rounded-xl p-4 text-center ${s.style.tile}`}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs mt-1 opacity-80">{s.label}</div>
              </div>
            ))}
          </div>

          {/* AI amplification banner */}
          {data.summary.ai_with_data_access > 0 && (
            <div className="mb-5 p-4 bg-red-900/20 border border-red-700/30 rounded-xl flex items-start gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <div className="text-red-300 font-semibold text-sm">
                  {data.summary.ai_with_data_access} AI tool{data.summary.ai_with_data_access !== 1 ? 's' : ''} with organizational data access
                </div>
                <div className="text-red-400/80 text-xs mt-0.5">
                  AI tools with email, file, or calendar access can expose confidential data through model training or data retention.
                  Review these apps immediately.
                </div>
              </div>
            </div>
          )}

          {/* Exposure breakdown */}
          {data.exposure_breakdown.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Exposure Breakdown</h2>
              <div className="space-y-2.5">
                {data.exposure_breakdown.map(e => {
                  const pct = Math.round((e.count / data.summary.total_apps) * 100);
                  return (
                    <div key={e.key} className="flex items-center gap-3">
                      <span className="text-base w-5 text-center shrink-0">{e.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300">{e.label}</span>
                          <span className="text-xs text-slate-500">{e.count} app{e.count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter tabs + app list */}
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-1 p-3 border-b border-surface-border">
              {[
                { key: 'all', label: 'All exposed' },
                { key: 'critical', label: 'Critical' },
                { key: 'high', label: 'High' },
                { key: 'ai', label: 'AI tools' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f.key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500">{filteredApps.length} apps</span>
            </div>

            {filteredApps.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No apps match this filter.</div>
            ) : (
              filteredApps.map(app => <AppRow key={app.app_id} app={app} />)
            )}
          </div>

          {/* Methodology note */}
          <div className="mt-4 p-4 bg-slate-800/40 border border-surface-border rounded-xl text-xs text-slate-500">
            <strong className="text-slate-400">How this works:</strong> Data sensitivity is inferred from OAuth scopes, stored permission flags, and known app categories.
            No actual file contents, emails, or user data are scanned. Scope-based inference may not capture all access if an app uses undocumented APIs.
            AI tool amplification flags apps where data training clauses or retention policies could expose organizational information.
          </div>
        </>
      )}

      {!data && !loading && activeWorkspace && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">🔒</div>
          <div className="text-slate-300 font-medium">No scan data found</div>
          <div className="text-sm mt-1">Run a workspace scan first to see data sensitivity analysis.</div>
        </div>
      )}
    </div>
  );
}
