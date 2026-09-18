import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiKey, listApiKeys, revokeApiKey } from '../api/apikeys';
import { useWorkspaceStore } from '../store/workspaceStore';

const ALL_PERMISSIONS = [
  { id: 'read:apps', label: 'Read Apps', desc: 'List and query app inventory' },
  { id: 'read:scans', label: 'Read Scans', desc: 'View scan history and results' },
  { id: 'read:analytics', label: 'Read Analytics', desc: 'Access trend data and charts' },
  { id: 'read:reports', label: 'Read Reports', desc: 'Download reports' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={copy}
      className="shrink-0 text-xs px-2 py-1 rounded bg-brand-600/20 text-brand-400 hover:bg-brand-600/40 transition-colors font-medium">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function NewKeyModal({ plaintext, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-lg space-y-4 p-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔑</span>
          <h2 className="text-lg font-bold text-white">API Key Created</h2>
        </div>
        <p className="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3">
          Copy this key now — it will never be shown again.
        </p>
        <div className="flex items-center gap-2 bg-slate-900 border border-surface-border rounded-lg px-3 py-2">
          <code className="flex-1 text-sm text-green-400 font-mono break-all">{plaintext}</code>
          <CopyButton text={plaintext} />
        </div>
        <div className="text-xs text-slate-500 space-y-1">
          <p>Use as: <code className="text-slate-400">Authorization: Bearer {plaintext}</code></p>
          <p>Base URL: <code className="text-slate-400">{window.location.origin.replace(':3000', ':5000')}/api</code></p>
        </div>
        <button onClick={onClose}
          className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">
          I've copied it — Close
        </button>
      </div>
    </div>
  );
}

export default function ApiKeys() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [permissions, setPermissions] = useState(['read:apps', 'read:scans', 'read:analytics']);
  const [newPlaintext, setNewPlaintext] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['apikeys', activeWorkspace?.id],
    queryFn: () => listApiKeys(activeWorkspace?.id).then(r => r.data),
    enabled: !!activeWorkspace?.id,
  });

  const createMut = useMutation({
    mutationFn: () => createApiKey({
      workspace_id: activeWorkspace?.id,
      name,
      permissions,
      expires_at: expiresAt || undefined,
    }),
    onSuccess: (res) => {
      setNewPlaintext(res.data.plaintext);
      setName('');
      setExpiresAt('');
      setPermissions(['read:apps', 'read:scans', 'read:analytics']);
      qc.invalidateQueries(['apikeys']);
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id) => revokeApiKey(id),
    onSuccess: () => qc.invalidateQueries(['apikeys']),
  });

  function togglePerm(id) {
    setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {newPlaintext && <NewKeyModal plaintext={newPlaintext} onClose={() => setNewPlaintext(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-sm text-slate-400 mt-1">Create keys for SIEM, SOAR, scripts, and external integrations.</p>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Create New Key</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Key Name <span className="text-red-400">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Splunk Integration"
              className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Expires (optional)</label>
            <input
              type="date"
              value={expiresAt}
              min={minDate.toISOString().slice(0, 10)}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2">Permissions</label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PERMISSIONS.map(p => (
              <label key={p.id} className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${permissions.includes(p.id) ? 'bg-brand-600/10 border-brand-500/40' : 'bg-slate-800/50 border-surface-border hover:border-slate-500'}`}>
                <input type="checkbox" checked={permissions.includes(p.id)} onChange={() => togglePerm(p.id)}
                  className="mt-0.5 accent-brand-500" />
                <div>
                  <div className="text-xs font-medium text-slate-200">{p.label}</div>
                  <div className="text-xs text-slate-500">{p.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => createMut.mutate()}
          disabled={!name.trim() || !activeWorkspace?.id || createMut.isPending || permissions.length === 0}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {createMut.isPending ? 'Creating…' : '+ Generate Key'}
        </button>
        {createMut.isError && (
          <p className="text-xs text-red-400">{createMut.error?.response?.data?.message || 'Failed to create key'}</p>
        )}
      </div>

      {/* Keys table */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-slate-300">Active Keys ({data?.keys?.length ?? 0})</h2>
        </div>
        {isLoading ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : !data?.keys?.length ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">No active keys</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Name', 'Prefix', 'Permissions', 'Last Used', 'Expires', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.keys.map(k => (
                <tr key={k.id} className="border-b border-surface-border/50 hover:bg-slate-700/10">
                  <td className="px-4 py-3 font-medium text-slate-200">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">{k.key_prefix}…</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(k.permissions || []).map(p => (
                        <span key={p} className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {k.expires_at ? (
                      <span className={new Date(k.expires_at) < new Date() ? 'text-red-400' : 'text-slate-400'}>
                        {new Date(k.expires_at).toLocaleDateString()}
                      </span>
                    ) : <span className="text-slate-500">Never</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (confirm(`Revoke "${k.name}"?`)) revokeMut.mutate(k.id); }}
                      className="text-xs px-2 py-1 rounded bg-red-600/10 text-red-400 hover:bg-red-600/30 transition-colors font-medium"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Usage guide */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Usage Guide</h2>
        <div className="space-y-2 text-xs text-slate-400">
          <p className="font-medium text-slate-300">REST API — list apps:</p>
          <pre className="bg-slate-900 rounded-lg p-3 text-green-400 overflow-x-auto">{`curl -H "Authorization: Bearer sit_<your-key>" \\
  "${window.location.origin.replace(':3000', ':5000')}/api/apps?workspace_id=<id>"`}</pre>
          <p className="font-medium text-slate-300 pt-2">Available endpoints (read-only):</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><code className="text-slate-300">GET /api/apps</code> — app inventory with risk scores</li>
            <li><code className="text-slate-300">GET /api/apps/export</code> — CSV export</li>
            <li><code className="text-slate-300">GET /api/scans</code> — scan history</li>
            <li><code className="text-slate-300">GET /api/analytics</code> — risk trend data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
