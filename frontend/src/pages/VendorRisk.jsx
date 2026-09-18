import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getVendorRisk } from '../api/vendorRisk';

const LEVEL_STYLE = {
  critical: { badge: 'bg-red-500/20 text-red-300 border border-red-600/40', dot: 'bg-red-400', row: 'border-red-900/30' },
  high:     { badge: 'bg-orange-500/20 text-orange-300 border border-orange-600/40', dot: 'bg-orange-400', row: 'border-orange-900/30' },
  medium:   { badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-600/40', dot: 'bg-yellow-400', row: 'border-slate-600/30' },
  low:      { badge: 'bg-green-500/20 text-green-300 border border-green-600/40', dot: 'bg-green-400', row: 'border-slate-600/20' },
};

function Pill({ ok, label }) {
  return ok === null ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-600 border border-slate-600/30">?</span>
  ) : ok ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-700/30">✓ {label}</span>
  ) : (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-700/30">✗ {label}</span>
  );
}

function VendorRow({ app }) {
  const [expanded, setExpanded] = useState(false);
  const style = LEVEL_STYLE[app.vendor_risk_level] || LEVEL_STYLE.low;

  return (
    <div className={`border-b border-surface-border last:border-0`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 py-3 px-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className={`shrink-0 w-2 h-2 rounded-full ${style.dot}`} />
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-3 items-center">
          {/* Name */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-white truncate">{app.app_name}</span>
              {app.is_ai_tool && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">AI</span>
              )}
              {app.high_risk_jurisdiction && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/40">⚠ Jurisdiction</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{app.legal_entity || app.developer || '—'}</div>
          </div>
          {/* Country */}
          <div className="text-sm text-center shrink-0" title={app.hq_country_name || 'Unknown'}>
            {app.hq_country_flag || '🏳️'}
            <div className="text-[10px] text-slate-500">{app.hq_country || '?'}</div>
          </div>
          {/* SOC 2 */}
          <Pill ok={app.soc2} label="SOC 2" />
          {/* ISO 27001 */}
          <Pill ok={app.iso27001} label="ISO" />
          {/* GDPR */}
          <Pill ok={app.gdpr} label="GDPR" />
          {/* Vendor Risk */}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${style.badge}`}>
            {app.vendor_risk_level.toUpperCase()}
          </span>
          {/* Score */}
          <span className="text-xs text-slate-500 w-6 text-right shrink-0">{app.vendor_risk_score}</span>
        </div>
        <span className="shrink-0 text-slate-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 bg-slate-800/20">
          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
            <div>
              <div className="text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[10px]">Vendor Details</div>
              <div className="space-y-1 text-slate-400">
                <div><span className="text-slate-600">Entity:</span> {app.legal_entity || '—'}</div>
                <div><span className="text-slate-600">HQ:</span> {app.hq_country_flag} {app.hq_country_name || '—'} ({app.hq_region || '—'})</div>
                <div><span className="text-slate-600">Data centers:</span> {app.data_centers?.join(', ') || '—'}</div>
                <div><span className="text-slate-600">Privacy policy:</span> {app.privacy_policy_date || 'Unknown'}</div>
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1 font-semibold uppercase tracking-wider text-[10px]">Certifications</div>
              {app.certifications?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {app.certifications.map(c => (
                    <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/20 text-green-400 border border-green-700/30">{c}</span>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600">No certifications in registry</div>
              )}
            </div>
          </div>

          {app.vendor_risk_factors?.length > 0 && (
            <div>
              <div className="text-slate-500 mb-1.5 font-semibold uppercase tracking-wider text-[10px]">Risk Factors</div>
              <div className="space-y-1.5">
                {app.vendor_risk_factors.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs px-2.5 py-1.5 rounded-lg ${f.weight > 0 ? 'bg-red-900/10 border border-red-900/20 text-red-300/90' : 'bg-slate-700/20 border border-slate-600/20 text-slate-400'}`}>
                    <span className="shrink-0 mt-0.5">{f.weight > 0 ? '⚠' : 'ℹ'}</span>
                    <span>{f.detail}</span>
                    {f.weight > 0 && <span className="ml-auto shrink-0 text-slate-500">+{f.weight}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!app.vendor_found && (
            <div className="mt-2 text-xs text-slate-500 italic">
              This vendor is not in the registry. Risk factors above are based on missing information only. Check the vendor's trust center manually.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VendorRisk() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    getVendorRisk(activeWorkspace.id)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const filtered = data?.apps?.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'jurisdiction') return a.high_risk_jurisdiction;
    if (filter === 'no_soc2') return a.soc2 === false;
    if (filter === 'no_gdpr') return a.gdpr === false;
    return a.vendor_risk_level === filter;
  }) ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Vendor Risk</h1>
        <p className="text-slate-400 text-sm mt-1">
          Legal entity, jurisdiction, SOC 2 status, GDPR compliance, and privacy policy age for every discovered app.
        </p>
      </div>

      {!activeWorkspace && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5 text-amber-300 text-sm">
          Select a workspace to see vendor risk analysis.
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">🏢</div>
          <div>Scoring vendors…</div>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Critical Vendors', value: data.summary.critical_vendor, color: 'text-red-400', bg: 'bg-red-900/20 border-red-700/30' },
              { label: 'Risk Jurisdiction', value: data.summary.high_risk_jurisdiction, color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-700/30' },
              { label: 'No SOC 2', value: data.summary.no_soc2, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/30' },
              { label: 'No GDPR DPA', value: data.summary.no_gdpr, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-700/30' },
              { label: 'Unknown Vendor', value: data.summary.unknown_vendor, color: 'text-slate-400', bg: 'bg-slate-700/20 border-slate-600/30' },
            ].map(s => (
              <div key={s.label} className={`border rounded-xl p-4 text-center ${s.bg}`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Country breakdown */}
          {data.country_breakdown?.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Vendor Jurisdictions</h2>
              <div className="flex flex-wrap gap-2">
                {data.country_breakdown.map(c => (
                  <div key={c.country} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm ${c.high_risk ? 'bg-red-900/20 border-red-700/30' : 'bg-slate-700/30 border-slate-600/30'}`}>
                    <span className="text-base">{c.flag}</span>
                    <span className={c.high_risk ? 'text-red-300' : 'text-slate-300'}>{c.name}</span>
                    <span className={`text-xs font-bold ml-1 ${c.high_risk ? 'text-red-400' : 'text-slate-500'}`}>{c.count}</span>
                    {c.high_risk && <span className="text-[10px] text-red-400">⚠</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            {/* Column header */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border bg-slate-800/40 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <div className="w-2" />
              <div className="flex-1 grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-3">
                <div>App / Vendor</div>
                <div className="w-10 text-center">HQ</div>
                <div>SOC 2</div>
                <div>ISO</div>
                <div>GDPR</div>
                <div>Vendor Risk</div>
                <div className="w-6 text-right">Score</div>
              </div>
              <div className="w-4" />
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-border">
              {[
                { key: 'all', label: 'All' },
                { key: 'critical', label: 'Critical' },
                { key: 'high', label: 'High' },
                { key: 'jurisdiction', label: 'Jurisdiction' },
                { key: 'no_soc2', label: 'No SOC 2' },
                { key: 'no_gdpr', label: 'No GDPR' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === f.key ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500">{filtered.length} vendors</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No apps match this filter.</div>
            ) : (
              filtered.map(app => <VendorRow key={app.app_id} app={app} />)
            )}
          </div>

          <div className="mt-4 p-4 bg-slate-800/40 border border-surface-border rounded-xl text-xs text-slate-500">
            <strong className="text-slate-400">Data sources:</strong> Vendor details sourced from public trust centers, privacy policies, and compliance documentation (accurate as of 2025).
            Registry covers 50+ major SaaS vendors. Unlisted vendors receive an "unknown" flag. Always verify directly with the vendor for procurement decisions.
          </div>
        </>
      )}

      {!data && !loading && activeWorkspace && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">🏢</div>
          <div className="text-slate-300 font-medium">No scan data found</div>
          <div className="text-sm mt-1">Run a workspace scan first to see vendor risk analysis.</div>
        </div>
      )}
    </div>
  );
}
