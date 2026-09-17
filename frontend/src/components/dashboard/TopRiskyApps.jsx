import RiskBadge from '../apps/RiskBadge';

export default function TopRiskyApps({ apps = [] }) {
  if (!apps.length) return <div className="text-slate-500 text-sm">No apps found yet.</div>;
  return (
    <div className="space-y-3">
      {apps.map(app => (
        <div key={app.id} className="flex items-center justify-between gap-3 py-2 border-b border-surface-border last:border-0">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{app.app_name}</div>
            <div className="text-xs text-slate-500 capitalize">{app.source} · {app.user_count} users</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold text-slate-300">{app.risk_score}</span>
            <RiskBadge level={app.risk_level} />
          </div>
        </div>
      ))}
    </div>
  );
}
