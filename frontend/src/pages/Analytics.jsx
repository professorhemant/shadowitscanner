import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { listWorkspaces } from '../api/workspaces';
import { getAnalytics } from '../api/analytics';

const RISK_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#3b82f6',
  low:      '#22c55e',
};

const DAYS_OPTIONS = [
  { value: 30,  label: '30 days' },
  { value: 90,  label: '90 days' },
  { value: 180, label: '6 months' },
];

function KpiTile({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
      <div className="text-slate-300 font-medium mb-1">Week of {label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const LEVEL_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const LEVEL_LABELS = { critical: '🔴 Critical', high: '🟠 High', medium: '🔵 Medium', low: '🟢 Low' };

export default function Analytics() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWs, setSelectedWs] = useState('');
  const [days, setDays] = useState(90);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listWorkspaces().then(r => {
      const ws = r.data.workspaces || [];
      setWorkspaces(ws);
      if (ws.length) setSelectedWs(ws[0].id);
    }).catch(() => {});
  }, []);

  const load = useCallback((wsId, d) => {
    if (!wsId) return;
    setLoading(true);
    getAnalytics(wsId, d).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(selectedWs, days); }, [selectedWs, days, load]);

  const dist = data?.distribution;
  const pieData = dist
    ? [
        { name: 'Critical', value: dist.critical, color: RISK_COLORS.critical },
        { name: 'High',     value: dist.high,     color: RISK_COLORS.high },
        { name: 'Medium',   value: dist.medium,   color: RISK_COLORS.medium },
        { name: 'Low',      value: dist.low,       color: RISK_COLORS.low },
      ].filter(p => p.value > 0)
    : [];

  const summary = data?.summary || {};

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Risk posture trends, new app discovery, and top exposure across your workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWs}
            onChange={e => setSelectedWs(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
          >
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {DAYS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  days === opt.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 text-slate-500 text-sm">Loading analytics…</div>
      )}

      {!loading && data && (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiTile label="Total Scans" value={summary.total_scans ?? 0} sub="completed" />
            <KpiTile label="Unique Apps" value={summary.total_apps ?? 0} sub="all time" />
            <KpiTile
              label="Critical Apps"
              value={dist?.critical ?? 0}
              sub="current"
              color={dist?.critical > 0 ? 'text-red-400' : 'text-white'}
            />
            <KpiTile label="AI Tools" value={summary.ai_tools ?? 0} sub="with data access" color="text-violet-400" />
            <KpiTile
              label="Clean Apps"
              value={`${summary.clean_pct ?? 100}%`}
              sub="low + medium risk"
              color={summary.clean_pct >= 80 ? 'text-emerald-400' : summary.clean_pct >= 60 ? 'text-yellow-400' : 'text-red-400'}
            />
          </div>

          {/* Risk trend + new apps side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk posture trend */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Risk Posture Trend</h2>
              {data.trend.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No scan data in this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                    <Line type="monotone" dataKey="critical" name="Critical" stroke={RISK_COLORS.critical} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="high"     name="High"     stroke={RISK_COLORS.high}     strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="apps_found" name="Total"  stroke="#6366f1"              strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* New apps per week */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">New Apps Discovered (by Week)</h2>
              {data.new_apps_by_week.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No new apps in this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.new_apps_by_week} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="New apps" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Distribution + Top apps side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk distribution donut */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Current Risk Distribution</h2>
              {pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No apps found yet</div>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {['critical','high','medium','low'].map(level => {
                      const count = dist?.[level] ?? 0;
                      const pct   = dist?.total ? Math.round(count / dist.total * 100) : 0;
                      return (
                        <div key={level} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[level] }} />
                            <span className="text-slate-300 capitalize">{level}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{count}</span>
                            <span className="text-slate-500 text-xs w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total</span>
                      <span className="text-white font-bold">{dist?.total ?? 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top 10 riskiest apps */}
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border">
                <h2 className="text-sm font-semibold text-white">Top 10 Riskiest Apps</h2>
              </div>
              {data.top_apps.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm">No apps found yet</div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {data.top_apps.map((app, i) => (
                    <div key={app.app_id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                      <span className="text-slate-500 text-xs w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-white truncate">{app.app_name}</span>
                          {app.is_ai_tool && <span className="text-[10px] bg-violet-900/40 text-violet-300 border border-violet-700/30 px-1.5 py-0.5 rounded-full">AI</span>}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{app.developer || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold" style={{ color: RISK_COLORS[app.risk_level] }}>
                          {app.risk_score}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize border"
                          style={{
                            color: RISK_COLORS[app.risk_level],
                            borderColor: RISK_COLORS[app.risk_level] + '44',
                            background: RISK_COLORS[app.risk_level] + '15',
                          }}
                        >
                          {app.risk_level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !data && selectedWs && (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-white font-medium">No data yet</div>
          <div className="text-slate-400 text-sm mt-1">Run a scan to start seeing analytics.</div>
        </div>
      )}
    </div>
  );
}
