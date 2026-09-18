import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { getExtensionStats } from '../api/extension';

const RISK_COLOR = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-blue-400',
  low: 'text-green-400',
};

const RISK_BG = {
  critical: 'bg-red-500/10 border-red-700/30',
  high: 'bg-orange-500/10 border-orange-700/30',
  medium: 'bg-slate-700/30 border-slate-600/30',
  low: 'bg-green-500/10 border-green-700/30',
};

const CAT_ICONS = {
  ai: '🤖', productivity: '📋', communication: '💬', dev: '⚙️',
  crm: '📊', hr: '👥', finance: '💳', storage: '☁️',
  marketing: '📢', design: '🎨', analytics: '📈', devops: '🚀',
  support: '🎧', security: '🔐', cloud: '☁️', web: '🌐',
};

const STEPS = [
  {
    num: 1,
    title: 'Download the extension',
    desc: 'The extension files are in the /extension folder of the ShadowITScanner repo.',
    detail: 'Clone or download the repository to get the extension directory.',
  },
  {
    num: 2,
    title: 'Open Chrome Extensions',
    desc: 'Go to chrome://extensions in your Chrome browser.',
    detail: 'You can also access it via Menu → More Tools → Extensions.',
  },
  {
    num: 3,
    title: 'Enable Developer Mode',
    desc: 'Toggle "Developer mode" ON in the top-right corner.',
    detail: 'This allows loading unpacked extensions from your local filesystem.',
  },
  {
    num: 4,
    title: 'Load the extension',
    desc: 'Click "Load unpacked" and select the /extension folder.',
    detail: 'The Shadow IT Scanner icon should appear in your toolbar.',
  },
  {
    num: 5,
    title: 'Configure the extension',
    desc: 'Click the Shield icon → enter your API token and workspace ID below.',
    detail: 'The extension will start monitoring and batch-report every 5 minutes.',
  },
];

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function Extension() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const token = useAuthStore(s => s.token);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    getExtensionStats(activeWorkspace.id)
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const backendUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'https://backend-production-59b25.up.railway.app';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Browser Extension</h1>
        <p className="text-slate-400 text-sm mt-1">
          Install the Chrome extension to automatically detect SaaS apps visited by your team — no OAuth needed.
        </p>
      </div>

      {/* Stats row */}
      {activeWorkspace && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Apps Detected', value: loading ? '…' : (stats?.summary?.total ?? 0), color: 'text-white' },
            { label: 'AI Tools', value: loading ? '…' : (stats?.summary?.ai_tools ?? 0), color: 'text-purple-400' },
            { label: 'Critical', value: loading ? '…' : (stats?.summary?.critical ?? 0), color: 'text-red-400' },
            { label: 'High Risk', value: loading ? '…' : (stats?.summary?.high ?? 0), color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left: setup steps */}
        <div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Installation Guide</h2>
            <div className="space-y-4">
              {STEPS.map(step => (
                <div key={step.num} className="flex gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {step.num}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{step.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{step.desc}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">How it works</h2>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5">•</span>
                Monitors URLs in real-time using Chrome's webNavigation API (no page content is read).
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5">•</span>
                Matches visited hostnames against 120+ known SaaS domains locally — no data leaves until the 5-minute flush.
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5">•</span>
                Batches discoveries and POSTs to your backend every 5 minutes using your API token.
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5">•</span>
                Detected apps appear in App Inventory tagged with source "extension" for easy filtering.
              </div>
              <div className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5">•</span>
                Only visited SaaS domains are reported — personal or unrecognized sites are ignored.
              </div>
            </div>
          </div>
        </div>

        {/* Right: credentials */}
        <div>
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Extension Credentials</h2>
            <p className="text-xs text-slate-400 mb-4">
              Copy these values into the extension popup after installation.
            </p>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1.5">API Token (your login session token)</div>
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2.5 border border-surface-border">
                  <span className="flex-1 font-mono text-xs text-slate-400 truncate">
                    {token ? `${token.slice(0, 20)}…${token.slice(-8)}` : '…'}
                  </span>
                  {token && <CopyButton value={token} />}
                </div>
                <p className="text-[10px] text-slate-600 mt-1">This is your current session JWT. Re-copy after logging in again.</p>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1.5">Workspace ID</div>
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2.5 border border-surface-border">
                  <span className="flex-1 font-mono text-xs text-slate-400">
                    {activeWorkspace ? String(activeWorkspace.id) : 'Select a workspace first'}
                  </span>
                  {activeWorkspace && <CopyButton value={String(activeWorkspace.id)} />}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1.5">Backend URL</div>
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2.5 border border-surface-border">
                  <span className="flex-1 font-mono text-xs text-slate-400 break-all">{backendUrl}</span>
                  <CopyButton value={backendUrl} />
                </div>
              </div>
            </div>
          </div>

          {/* Detected apps list */}
          {stats?.apps?.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Detected Apps ({stats.apps.length})
              </h2>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {stats.apps.map(app => (
                  <div key={app.app_id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${RISK_BG[app.risk_level] || RISK_BG.medium}`}>
                    <span className="text-base">{CAT_ICONS[app.category] || '🌐'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm text-white font-medium">{app.app_name}</span>
                        {app.is_ai_tool && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">AI</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{app.developer}</div>
                    </div>
                    <span className={`text-[10px] font-semibold shrink-0 ${RISK_COLOR[app.risk_level]}`}>
                      {app.risk_level?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!activeWorkspace && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 text-amber-300 text-sm">
              Select a workspace from the dropdown to see extension credentials and detected apps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
