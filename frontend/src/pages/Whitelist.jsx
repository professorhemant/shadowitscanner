import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listApps, removeWhitelist } from '../api/apps';
import { useWorkspaceStore } from '../store/workspaceStore';
import RiskBadge from '../components/apps/RiskBadge';

export default function Whitelist() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['whitelisted-apps', activeWorkspace?.id],
    queryFn: () => listApps({ workspace_id: activeWorkspace?.id, limit: 200 }).then(r =>
      r.data.apps.filter(a => a.is_whitelisted)
    ),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => removeWhitelist(id),
    onSuccess: () => qc.invalidateQueries(['whitelisted-apps']),
  });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-2">Whitelisted Apps</h1>
      <p className="text-slate-400 text-sm mb-6">Apps your team has reviewed and approved. They will no longer appear in active risk counts.</p>

      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['App Name','Source','Risk','Approved',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No whitelisted apps yet.</td></tr>
            ) : data.map(app => (
              <tr key={app.id} className="border-b border-surface-border/50">
                <td className="px-4 py-3 text-slate-200 font-medium">{app.app_name}</td>
                <td className="px-4 py-3 text-slate-400 capitalize">{app.source}</td>
                <td className="px-4 py-3"><RiskBadge level={app.risk_level} /></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(app.last_seen_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => removeMutation.mutate(app.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
