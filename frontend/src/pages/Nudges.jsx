import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNudges, sendNudge } from '../api/nudges';
import { listApps } from '../api/apps';
import { useWorkspaceStore } from '../store/workspaceStore';
import RiskBadge from '../components/apps/RiskBadge';

export default function Nudges() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();
  const [sendModal, setSendModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [recipientsInput, setRecipientsInput] = useState('');
  const [appSearch, setAppSearch] = useState('');
  const [sendResult, setSendResult] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['nudges', activeWorkspace?.id],
    queryFn: () => listNudges({ workspace_id: activeWorkspace?.id }).then(r => r.data),
    enabled: !!activeWorkspace?.id,
  });

  const { data: appsData } = useQuery({
    queryKey: ['apps-nudge', activeWorkspace?.id, appSearch],
    queryFn: () => listApps({
      workspace_id: activeWorkspace?.id,
      search: appSearch || undefined,
      risk_level: 'high',
      limit: 20,
      sort: 'risk_score',
      order: 'DESC',
    }).then(r => r.data),
    enabled: sendModal && !!activeWorkspace?.id,
  });

  const mutation = useMutation({
    mutationFn: (payload) => sendNudge(payload),
    onSuccess: (res) => {
      setSendResult(res.data.message || 'Nudge sent');
      qc.invalidateQueries(['nudges']);
      setSelectedApp(null);
      setRecipientsInput('');
    },
    onError: (err) => setSendResult(err.response?.data?.message || 'Failed to send'),
  });

  function handleSend() {
    if (!selectedApp) return;
    const recipients = recipientsInput.split(',').map(s => s.trim()).filter(Boolean);
    mutation.mutate({
      workspace_id: activeWorkspace?.id,
      app_id: selectedApp.app_id,
      recipients,
    });
  }

  const logs = data?.logs || [];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Nudge History</h1>
          <p className="text-slate-400 text-sm mt-0.5">Security nudges sent to your IT team about risky apps</p>
        </div>
        <button
          onClick={() => { setSendModal(true); setSendResult(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <span>📣</span> Send Manual Nudge
        </button>
      </div>

      {/* Stats bar */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total nudges sent', value: logs.length },
            { label: 'Auto-triggered', value: logs.filter(l => l.nudge_type === 'auto').length },
            { label: 'Manual', value: logs.filter(l => l.nudge_type === 'manual').length },
          ].map(s => (
            <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['Sent at', 'App', 'Source', 'Risk', 'Score', 'Users', 'Recipients', 'Type'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="text-4xl mb-3">📣</div>
                  <div className="text-slate-400 font-medium">No nudges sent yet</div>
                  <div className="text-slate-500 text-xs mt-1">Nudges are logged here when sent — automatically after a scan or manually from app details.</div>
                </td>
              </tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b border-surface-border/50 hover:bg-slate-700/10">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(log.sent_at).toLocaleDateString()}<br />
                  <span className="text-slate-600">{new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-200">{log.app_name}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 capitalize">{log.source || '—'}</td>
                <td className="px-4 py-3"><RiskBadge level={log.risk_level} /></td>
                <td className="px-4 py-3 font-bold text-slate-200">{log.risk_score}</td>
                <td className="px-4 py-3 text-slate-400">{log.user_count}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {(log.recipients || []).length > 0
                    ? <span title={(log.recipients || []).join(', ')}>{(log.recipients || []).length} recipient{(log.recipients || []).length !== 1 ? 's' : ''}</span>
                    : <span className="text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${log.nudge_type === 'auto' ? 'bg-blue-600/20 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                    {log.nudge_type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Send manual nudge modal */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSendModal(false)}>
          <div className="bg-surface-card rounded-xl w-full max-w-md border border-surface-border shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">📣 Send Manual Nudge</h2>
              <button onClick={() => setSendModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Search high-risk apps</label>
                <input
                  placeholder="Type app name…"
                  value={appSearch}
                  onChange={e => { setAppSearch(e.target.value); setSelectedApp(null); }}
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
                {appsData?.apps?.length > 0 && !selectedApp && (
                  <div className="mt-1 bg-slate-800 border border-surface-border rounded-lg overflow-hidden">
                    {appsData.apps.map(app => (
                      <button
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700 text-left border-b border-surface-border/50 last:border-0"
                      >
                        <span className="text-slate-200 text-sm">{app.app_name}</span>
                        <div className="flex items-center gap-2">
                          <RiskBadge level={app.risk_level} />
                          <span className="text-slate-400 text-xs capitalize">{app.source}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedApp && (
                <div className="bg-slate-800/60 border border-surface-border rounded-lg px-3 py-2 flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 text-sm font-medium">{selectedApp.app_name}</div>
                    <div className="text-slate-500 text-xs capitalize">{selectedApp.source} · score {selectedApp.risk_score}</div>
                  </div>
                  <RiskBadge level={selectedApp.risk_level} />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Recipients <span className="text-slate-600">(comma-separated, leave blank to use Alert config)</span>
                </label>
                <input
                  placeholder="it@company.com, security@company.com"
                  value={recipientsInput}
                  onChange={e => setRecipientsInput(e.target.value)}
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              {sendResult && (
                <div className={`text-sm px-3 py-2 rounded-lg ${sendResult.includes('ailed') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                  {sendResult}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-surface-border flex justify-end gap-3">
              <button onClick={() => setSendModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleSend}
                disabled={!selectedApp || mutation.isPending}
                className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors disabled:opacity-40"
              >
                {mutation.isPending ? 'Sending…' : '📣 Send Nudge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
