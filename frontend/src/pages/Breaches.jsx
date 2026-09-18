import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getBreaches } from '../api/breaches';

const SEVERITY_STYLES = {
  critical: { badge: 'bg-red-900/40 text-red-300 border border-red-700/50', bar: 'bg-red-500', dot: 'bg-red-400', label: 'CRITICAL' },
  high:     { badge: 'bg-orange-900/40 text-orange-300 border border-orange-700/50', bar: 'bg-orange-500', dot: 'bg-orange-400', label: 'HIGH' },
  medium:   { badge: 'bg-blue-900/40 text-blue-300 border border-blue-700/50', bar: 'bg-blue-500', dot: 'bg-blue-400', label: 'MEDIUM' },
};

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function BreachCard({ alert }) {
  const sev = SEVERITY_STYLES[alert.highest_severity] || SEVERITY_STYLES.medium;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${sev.dot}`} />
          <div>
            <span className="text-white font-semibold">{alert.app_name}</span>
            {alert.developer && <span className="text-slate-500 text-xs ml-2">by {alert.developer}</span>}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sev.badge}`}>{sev.label}</span>
          {alert.is_ai_tool && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">AI</span>
          )}
        </div>
        <div className="text-right text-xs text-slate-400">
          <div className="text-slate-300 font-medium">{alert.user_count ?? '?'} users authorized</div>
          <div>Source: {alert.source}</div>
        </div>
      </div>

      {/* Breaches list */}
      <div className="divide-y divide-surface-border">
        {alert.breaches.map((b, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{b.title}</span>
                  {b.cve && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{b.cve}</span>
                  )}
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{formatDate(b.date)}</div>
              </div>
              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${SEVERITY_STYLES[b.severity]?.badge || SEVERITY_STYLES.medium.badge}`}>
                {b.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">{b.description}</p>
            {b.affected_data && b.affected_data.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-slate-500 text-xs self-center">Affected data:</span>
                {b.affected_data.map(d => (
                  <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">{d}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Breaches() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);

  const { data, isLoading, error } = useQuery({
    queryKey: ['breaches', activeWorkspace?.id],
    queryFn: () => getBreaches(activeWorkspace.id).then(r => r.data),
    enabled: !!activeWorkspace?.id,
  });

  const summary = data?.summary;
  const alerts = data?.alerts ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Breach & CVE Alerts</h1>
        <p className="text-slate-400 text-sm mt-1">
          Apps in your workspace cross-referenced against known data breaches and security incidents.
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Apps Scanned', value: summary.total_apps_scanned, cls: 'text-white' },
            { label: 'Critical Breaches', value: summary.critical_count, cls: 'text-red-400' },
            { label: 'High Severity', value: summary.high_count, cls: 'text-orange-400' },
            { label: 'Clean Apps', value: summary.clean_apps, cls: 'text-green-400' },
          ].map(c => (
            <div key={c.label} className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
              <div className={`text-3xl font-bold ${c.cls}`}>{c.value}</div>
              <div className="text-slate-400 text-xs mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Alert banner if any critical/high */}
      {summary && summary.apps_with_breaches > 0 && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-900/20 border border-red-700/40 rounded-xl">
          <span className="text-xl shrink-0">🚨</span>
          <div>
            <div className="text-red-300 font-semibold text-sm">
              {summary.apps_with_breaches} app{summary.apps_with_breaches !== 1 ? 's' : ''} in your workspace{summary.apps_with_breaches !== 1 ? ' have' : ' has'} known security breaches.
            </div>
            <div className="text-red-400/80 text-xs mt-0.5">
              Review each incident below and verify your organization's exposure. Rotate any API tokens or credentials stored in affected systems.
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16 text-slate-400">Checking breach database…</div>
      )}

      {/* No workspace */}
      {!activeWorkspace && !isLoading && (
        <div className="text-center py-16 text-slate-400">Select a workspace to check for breach alerts.</div>
      )}

      {/* No breaches found */}
      {!isLoading && activeWorkspace && alerts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <div className="text-white font-semibold">No known breaches found</div>
          <div className="text-slate-400 text-sm mt-2">
            None of your {summary?.total_apps_scanned ?? 0} discovered apps match our breach database.
          </div>
        </div>
      )}

      {/* Breach cards */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map(a => <BreachCard key={a.app_id} alert={a} />)}
        </div>
      )}

      {/* Footer note */}
      {alerts.length > 0 && (
        <p className="text-slate-600 text-xs mt-6 text-center">
          Breach data sourced from public security disclosures. Dates and severity reflect the original incident report.
          This does not guarantee exhaustive coverage of all known vulnerabilities.
        </p>
      )}
    </div>
  );
}
