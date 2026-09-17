import { useQuery } from '@tanstack/react-query';
import { getScanHistory } from '../api/scans';
import { useWorkspaceStore } from '../store/workspaceStore';
import RiskBadge from '../components/apps/RiskBadge';

const STATUS_COLOR = { completed: 'text-green-400', running: 'text-blue-400', failed: 'text-red-400', pending: 'text-slate-400' };

export default function ScanHistory() {
  const { activeWorkspace } = useWorkspaceStore();

  const { data, isLoading } = useQuery({
    queryKey: ['scan-history', activeWorkspace?.id],
    queryFn: () => getScanHistory(activeWorkspace?.id).then(r => r.data.runs),
  });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Scan History</h1>
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['Date','Source','Triggered By','Status','Apps Found','Critical','High'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No scans yet. Run your first scan from the dashboard.</td></tr>
            ) : data.map(run => (
              <tr key={run.id} className="border-b border-surface-border/50">
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(run.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-300 capitalize">{run.source}</td>
                <td className="px-4 py-3 text-slate-400 capitalize">{run.triggered_by}</td>
                <td className={`px-4 py-3 font-medium capitalize ${STATUS_COLOR[run.status]}`}>{run.status}</td>
                <td className="px-4 py-3 text-slate-200 font-medium">{run.apps_found ?? '—'}</td>
                <td className="px-4 py-3 text-red-400 font-bold">{run.critical_count ?? '—'}</td>
                <td className="px-4 py-3 text-orange-400 font-bold">{run.high_count ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
