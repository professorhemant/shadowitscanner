import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listApps } from '../api/apps';
import { useWorkspaceStore } from '../store/workspaceStore';

const NAV_ITEMS = [
  { label: 'Dashboard',         to: '/dashboard',    icon: '▦',  group: 'Pages' },
  { label: 'App Inventory',     to: '/apps',         icon: '⊞',  group: 'Pages' },
  { label: 'Scan History',      to: '/scans',        icon: '↺',  group: 'Pages' },
  { label: 'Whitelist',         to: '/whitelist',    icon: '✓',  group: 'Pages' },
  { label: 'Alerts',            to: '/alerts',       icon: '🔔', group: 'Pages' },
  { label: 'Nudges',            to: '/nudges',       icon: '📣', group: 'Pages' },
  { label: 'Approvals',         to: '/approvals',    icon: '📋', group: 'Pages' },
  { label: 'Spend Estimator',   to: '/spend',        icon: '💰', group: 'Pages' },
  { label: 'Offboarding',       to: '/offboarding',  icon: '🚪', group: 'Pages' },
  { label: 'Extension',         to: '/extension',    icon: '🧩', group: 'Pages' },
  { label: 'Data Sensitivity',  to: '/sensitivity',  icon: '🔒', group: 'Pages' },
  { label: 'Vendor Risk',       to: '/vendor-risk',  icon: '🏢', group: 'Pages' },
  { label: 'Slack Bot',         to: '/slack-bot',    icon: '💬', group: 'Pages' },
  { label: 'Webhooks',          to: '/webhooks',     icon: '🔗', group: 'Pages' },
  { label: 'API Keys',          to: '/api-keys',     icon: '🔑', group: 'Pages' },
  { label: 'Audit Log',         to: '/audit',        icon: '🗒️', group: 'Pages' },
  { label: 'Email Digest',      to: '/digest',       icon: '📨', group: 'Pages' },
  { label: 'Auto-Scan',         to: '/auto-scan',    icon: '⚡', group: 'Pages' },
  { label: 'Analytics',         to: '/analytics',    icon: '📊', group: 'Pages' },
  { label: 'Team',              to: '/team',         icon: '👥', group: 'Pages' },
  { label: 'Risk Policies',     to: '/policies',     icon: '📋', group: 'Pages' },
  { label: 'Breach Alerts',     to: '/breaches',     icon: '🚨', group: 'Pages' },
  { label: 'Reports',           to: '/reports',      icon: '📄', group: 'Pages' },
  { label: 'Connect Workspace', to: '/connect',      icon: '+',  group: 'Pages' },
  { label: 'Settings',          to: '/settings',     icon: '⚙',  group: 'Pages' },
];

const RISK_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' };

function fuzzy(str, query) {
  if (!query) return true;
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  let si = 0;
  for (let qi = 0; qi < q.length; qi++) {
    si = s.indexOf(q[qi], si);
    if (si === -1) return false;
    si++;
  }
  return true;
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [appResults, setAppResults] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setAppResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim() || !activeWorkspace?.id) { setAppResults([]); return; }
    debounceRef.current = setTimeout(() => {
      setLoadingApps(true);
      listApps({ workspace_id: activeWorkspace.id, search: query, limit: 5, sort: 'risk_score', order: 'DESC' })
        .then(r => setAppResults(r.data.apps || []))
        .catch(() => setAppResults([]))
        .finally(() => setLoadingApps(false));
    }, 220);
  }, [query, activeWorkspace?.id]);

  const navResults = NAV_ITEMS.filter(n => fuzzy(n.label, query));

  const allResults = [
    ...navResults.map(n => ({ ...n, type: 'nav' })),
    ...appResults.map(a => ({ label: a.app_name, sub: `${a.source} · ${a.risk_level} · score ${a.risk_score}`, icon: a.is_ai_tool ? '🤖' : '📦', group: 'Apps', type: 'app', riskLevel: a.risk_level, to: '/apps' })),
  ];

  useEffect(() => { setActiveIdx(0); }, [query]);

  const go = useCallback((item) => {
    if (!item) return;
    navigate(item.to);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allResults.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); go(allResults[activeIdx]); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, allResults, activeIdx, go, onClose]);

  useEffect(() => {
    const el = listRef.current?.children[activeIdx];
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  // Group results for rendering
  const groups = [];
  let lastGroup = null;
  allResults.forEach((item, idx) => {
    if (item.group !== lastGroup) {
      groups.push({ type: 'header', label: item.group });
      lastGroup = item.group;
    }
    groups.push({ type: 'item', item, idx });
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[580px] mx-4 bg-[#1e293b] rounded-2xl border border-[#334155] shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#334155]">
          <span className="text-slate-500 text-lg">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, apps, actions…"
            className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-600 focus:outline-none"
          />
          {loadingApps && <span className="text-slate-600 text-xs animate-pulse">Searching…</span>}
          <kbd className="text-slate-600 text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto" ref={listRef}>
          {allResults.length === 0 && query ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No results for "{query}"</div>
          ) : allResults.length === 0 ? (
            <div className="px-4 py-3">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 px-1">Pages</div>
              {NAV_ITEMS.slice(0, 8).map((n, i) => (
                <button
                  key={n.to}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => go({ ...n, type: 'nav' })}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${i === activeIdx ? 'bg-brand-600/20 text-white' : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'}`}
                >
                  <span className="text-base w-5 text-center opacity-70">{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-2">
              {(() => {
                const rendered = [];
                let lastGrp = null;
                allResults.forEach((item, idx) => {
                  if (item.group !== lastGrp) {
                    rendered.push(
                      <div key={`hdr-${item.group}`} className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {item.group}
                      </div>
                    );
                    lastGrp = item.group;
                  }
                  rendered.push(
                    <button
                      key={`${item.type}-${idx}`}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => go(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${idx === activeIdx ? 'bg-brand-600/20 text-white' : 'text-slate-300 hover:bg-slate-700/40'}`}
                    >
                      <span className="text-base w-5 text-center opacity-70 shrink-0">{item.icon}</span>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.sub && (
                        <span className="text-xs shrink-0" style={{ color: RISK_COLOR[item.riskLevel] || '#64748b' }}>
                          {item.sub}
                        </span>
                      )}
                      {item.type === 'nav' && (
                        <span className="text-xs text-slate-600 shrink-0">↵</span>
                      )}
                    </button>
                  );
                });
                return rendered;
              })()}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#334155] text-xs text-slate-600">
          <span><kbd className="bg-slate-800 border border-slate-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="bg-slate-800 border border-slate-700 rounded px-1">↵</kbd> open</span>
          <span><kbd className="bg-slate-800 border border-slate-700 rounded px-1">ESC</kbd> close</span>
          <span className="ml-auto opacity-60">Shadow IT</span>
        </div>
      </div>
    </div>
  );
}
