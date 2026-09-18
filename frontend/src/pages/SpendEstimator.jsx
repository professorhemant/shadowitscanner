import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSpend } from '../api/spend';
import { useWorkspaceStore } from '../store/workspaceStore';
import RiskBadge from '../components/apps/RiskBadge';

const CATEGORY_COLORS = {
  'AI / LLM':        'bg-purple-600/20 text-purple-300',
  'AI / Developer':  'bg-purple-600/20 text-purple-300',
  'AI / Search':     'bg-purple-600/20 text-purple-300',
  'AI / Meetings':   'bg-purple-600/20 text-purple-300',
  'CRM':             'bg-blue-600/20 text-blue-300',
  'CRM / Marketing': 'bg-blue-600/20 text-blue-300',
  'Productivity':    'bg-green-600/20 text-green-300',
  'Automation':      'bg-yellow-600/20 text-yellow-300',
  'HR':              'bg-orange-600/20 text-orange-300',
  'HR / ERP':        'bg-orange-600/20 text-orange-300',
  'Communication':   'bg-teal-600/20 text-teal-300',
};

function fmt(n) {
  if (n == null) return null;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function CostBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct > 66 ? 'bg-red-500' : pct > 33 ? 'bg-orange-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-300 w-16 text-right">{fmt(value)}</span>
    </div>
  );
}

export default function SpendEstimator() {
  const { activeWorkspace } = useWorkspaceStore();
  const [filter, setFilter] = useState('all'); // all | known | custom | unknown

  const { data, isLoading } = useQuery({
    queryKey: ['spend', activeWorkspace?.id],
    queryFn: () => getSpend({ workspace_id: activeWorkspace?.id }).then(r => r.data),
    enabled: !!activeWorkspace?.id,
  });

  function exportCSV() {
    if (!data?.apps) return;
    const rows = [
      ['App', 'Source', 'Users', 'Category', 'IT Plan', 'Monthly Cost', 'Annual Cost', 'Risk Level'],
      ...data.apps.map(a => [
        a.app_name,
        a.source,
        a.user_count,
        a.pricing?.category || 'Unknown',
        a.pricing ? `${a.pricing.it_plan_name}` : '—',
        a.estimated_monthly != null ? a.estimated_monthly : (a.is_custom_pricing ? 'Custom' : '—'),
        a.estimated_annual != null ? a.estimated_annual : '—',
        a.risk_level,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'saas-spend-estimate.csv'; a.click();
  }

  const apps = data?.apps || [];
  const summary = data?.summary;
  const maxMonthly = Math.max(...apps.filter(a => a.estimated_monthly != null).map(a => a.estimated_monthly), 1);

  const filtered = apps.filter(a => {
    if (filter === 'known')   return a.estimated_monthly != null;
    if (filter === 'custom')  return a.is_custom_pricing;
    if (filter === 'unknown') return !a.pricing;
    return true;
  });

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SaaS Spend Estimator</h1>
          <p className="text-slate-400 text-sm mt-0.5">Estimated cost to license discovered apps under IT management</p>
        </div>
        {apps.length > 0 && (
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface-card border border-surface-border text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors">
            ↓ Export CSV
          </button>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{summary.total_apps}</div>
            <div className="text-slate-400 text-xs mt-0.5">Apps discovered</div>
          </div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-300">{summary.apps_with_known_cost}</div>
            <div className="text-slate-400 text-xs mt-0.5">Apps with known pricing</div>
          </div>
          <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-300">{fmt(summary.total_monthly) ?? '$0'}</div>
            <div className="text-slate-400 text-xs mt-0.5">Est. monthly if licensed</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-300">{fmt(summary.total_annual) ?? '$0'}</div>
            <div className="text-slate-400 text-xs mt-0.5">Est. annual spend</div>
          </div>
        </div>
      )}

      {/* Insight banner */}
      {summary && summary.total_monthly > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <span className="text-amber-200 font-medium text-sm">IT Spend Insight</span>
            <p className="text-amber-300/80 text-xs mt-0.5">
              Your team is using <strong>{summary.apps_with_known_cost} tools</strong> that could cost approximately <strong>{fmt(summary.total_monthly)}/month</strong> ({fmt(summary.total_annual)}/year) under IT-managed plans. These tools are likely being used on <strong>free or personal tiers</strong> right now — with no admin visibility or data controls.
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: `All (${apps.length})` },
          { key: 'known', label: `Known cost (${summary?.apps_with_known_cost ?? 0})` },
          { key: 'custom', label: `Custom pricing (${summary?.apps_custom_pricing ?? 0})` },
          { key: 'unknown', label: `No pricing data (${summary?.apps_unknown_pricing ?? 0})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? 'bg-brand-600 text-white' : 'bg-surface-card border border-surface-border text-slate-400 hover:border-slate-500'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['App', 'Category', 'Source', 'Risk', 'Users', 'IT-Managed Plan', 'Est. Monthly Cost', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-slate-400 font-medium">No apps to display</div>
                  <div className="text-slate-500 text-xs mt-1">Run a scan or load demo data to see spend estimates.</div>
                </td>
              </tr>
            ) : filtered.map(app => (
              <tr key={app.app_id} className="border-b border-surface-border/50 hover:bg-slate-700/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{app.app_name}</span>
                    {app.is_ai_tool && <span className="text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-medium">AI</span>}
                  </div>
                  {app.developer && <div className="text-slate-600 text-xs">{app.developer}</div>}
                </td>
                <td className="px-4 py-3">
                  {app.pricing?.category ? (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${CATEGORY_COLORS[app.pricing.category] || 'bg-slate-700 text-slate-400'}`}>
                      {app.pricing.category}
                    </span>
                  ) : <span className="text-slate-600 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-400 capitalize text-xs">{app.source}</td>
                <td className="px-4 py-3"><RiskBadge level={app.risk_level} /></td>
                <td className="px-4 py-3 text-slate-300 font-medium">{app.user_count}</td>
                <td className="px-4 py-3">
                  {app.pricing ? (
                    <div>
                      <div className="text-slate-200 text-xs font-medium">{app.pricing.it_plan_name}</div>
                      <div className="text-slate-500 text-xs">
                        {app.pricing.it_plan_price_per_user != null
                          ? `$${app.pricing.it_plan_price_per_user}/user/mo`
                          : app.pricing.it_plan_price_flat != null
                          ? `$${app.pricing.it_plan_price_flat}/mo flat`
                          : 'Contact sales'}
                      </div>
                    </div>
                  ) : <span className="text-slate-600 text-xs">No data</span>}
                </td>
                <td className="px-4 py-3 min-w-[160px]">
                  {app.estimated_monthly != null ? (
                    <CostBar value={app.estimated_monthly} max={maxMonthly} />
                  ) : app.is_custom_pricing ? (
                    <span className="text-slate-500 text-xs italic">Custom pricing</span>
                  ) : (
                    <span className="text-slate-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {app.estimated_annual != null && (
                    <div className="text-slate-500 text-xs whitespace-nowrap">{fmt(app.estimated_annual)}/yr</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 0 && summary?.total_monthly > 0 && filter !== 'custom' && filter !== 'unknown' && (
          <div className="border-t border-surface-border px-4 py-3 flex justify-end items-center gap-4 bg-slate-800/40">
            <span className="text-xs text-slate-500">Estimated total</span>
            <span className="text-slate-300 font-bold">{fmt(summary.total_monthly)}/mo</span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-green-400 font-bold">{fmt(summary.total_annual)}/yr</span>
          </div>
        )}
      </div>

      <p className="text-slate-600 text-xs">
        Pricing estimates are based on publicly available pricing as of 2026 and may differ from current rates. Per-user costs are calculated using the discovered user count. Apps on free tiers may have no current cost but lack IT admin controls.
      </p>
    </div>
  );
}
