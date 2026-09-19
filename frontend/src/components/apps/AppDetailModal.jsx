import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import RiskBadge from './RiskBadge';
import { sendNudge } from '../../api/nudges';
import { getAppDetail, whitelistApp, removeWhitelist } from '../../api/apps';
import { useWorkspaceStore } from '../../store/workspaceStore';

// Scope risk classification
const SCOPE_RISK = {
  high: ['admin', 'sudo', 'superadmin', 'delete', 'manage', 'write', 'edit', 'modify', 'gmail.modify', 'gmail.compose', 'mail.send', 'spreadsheets', 'drive', 'calendar', 'contacts.readwrite', 'files.readwrite', 'directory'],
  medium: ['read', 'readonly', 'view', 'offline_access', 'refresh_token'],
  low: ['profile', 'email', 'openid', 'identify', 'users:read'],
};

function scopeLevel(scope) {
  const s = scope.toLowerCase();
  if (SCOPE_RISK.high.some(k => s.includes(k))) return 'high';
  if (SCOPE_RISK.medium.some(k => s.includes(k))) return 'medium';
  return 'low';
}

const SCOPE_COLOR = {
  high:   'bg-red-900/30 text-red-300 border-red-700/30',
  medium: 'bg-amber-900/30 text-amber-300 border-amber-700/30',
  low:    'bg-slate-800 text-slate-400 border-slate-700/40',
};

function RiskGauge({ score, level }) {
  const COLORS = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' };
  const color = COLORS[level] || '#94a3b8';
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} strokeWidth="8" stroke="#1e293b" fill="none" />
          <circle cx="48" cy="48" r={r} strokeWidth="8" stroke={color} fill="none"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-[10px] text-slate-500 -mt-0.5">/ 100</span>
        </div>
      </div>
      <div>
        <RiskBadge level={level} />
        <p className="text-xs text-slate-500 mt-1 leading-snug">
          {level === 'critical' && 'Immediate attention required.'}
          {level === 'high' && 'Elevated risk — review urgently.'}
          {level === 'medium' && 'Moderate risk — monitor closely.'}
          {level === 'low' && 'Low risk — likely safe to approve.'}
        </p>
      </div>
    </div>
  );
}

function PropRow({ label, value, highlight }) {
  return (
    <div className={`flex items-start justify-between gap-2 py-2 border-b border-slate-800 last:border-0 ${highlight ? 'text-red-300' : ''}`}>
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs font-medium text-right ${highlight ? 'text-red-300' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { dateStyle: 'medium' });
}

export default function AppDetailModal({ app: initialApp, onClose, onWhitelist }) {
  const { activeWorkspace } = useWorkspaceStore();
  const [nudgeSent, setNudgeSent] = useState(false);
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const qc = useQueryClient();

  // Reset nudge state when app changes
  useEffect(() => { setNudgeSent(false); setReason(''); setShowReason(false); }, [initialApp?.id]);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['app-detail', initialApp?.id],
    queryFn: () => getAppDetail(initialApp.id).then(r => r.data),
    enabled: !!initialApp?.id,
    staleTime: 30_000,
  });

  const app = detail?.app || initialApp;
  const wlInfo = detail?.whitelist_info;

  const nudgeMutation = useMutation({
    mutationFn: () => sendNudge({ workspace_id: activeWorkspace?.id, app_id: app.app_id }),
    onSuccess: () => setNudgeSent(true),
  });

  const wlMutation = useMutation({
    mutationFn: () => app.is_whitelisted
      ? removeWhitelist(app.id)
      : whitelistApp(app.id, reason || undefined),
    onSuccess: () => {
      qc.invalidateQueries(['apps']);
      qc.invalidateQueries(['app-detail', app.id]);
      setShowReason(false);
      setReason('');
    },
  });

  if (!initialApp) return null;

  const scopes = app.scopes || [];
  const riskFactors = app.risk_factors || [];
  const policyFlags = app.policy_flags || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-[#0f172a] border-l border-slate-700/60 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-white truncate">{app.app_name}</h2>
              {app.is_ai_tool && (
                <span className="shrink-0 text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-medium">AI</span>
              )}
              {app.is_whitelisted && (
                <span className="shrink-0 text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium">✓ Approved</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5 capitalize">
              {app.source} · {app.developer || 'Unknown developer'}
            </p>
            {app.app_description && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{app.app_description}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-500 hover:text-slate-200 text-2xl leading-none transition-colors mt-0.5">×</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading && (
            <div className="text-center py-8 text-slate-500 text-sm">Loading details…</div>
          )}

          {/* Risk gauge */}
          <section>
            <RiskGauge score={app.risk_score} level={app.risk_level} />
          </section>

          {/* Policy flags */}
          {policyFlags.length > 0 && (
            <section className="bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-amber-300 mb-1.5">⚠ Policy rules matched</div>
              <div className="flex flex-wrap gap-1.5">
                {policyFlags.map(f => (
                  <span key={f} className="text-xs bg-amber-800/30 text-amber-200 border border-amber-700/30 px-2 py-0.5 rounded">{f}</span>
                ))}
              </div>
            </section>
          )}

          {/* Risk factors */}
          {riskFactors.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Why is this risky?</h3>
              <div className="space-y-2">
                {riskFactors.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                    <span className="text-orange-400 text-xs mt-0.5 shrink-0">+{f.weight}</span>
                    <span className="text-sm text-slate-300">{f.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* OAuth Scopes */}
          {scopes.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                OAuth Scopes <span className="text-slate-600 normal-case font-normal">({scopes.length})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {scopes.map(s => (
                  <span key={s} className={`text-xs px-2 py-0.5 rounded border font-mono ${SCOPE_COLOR[scopeLevel(s)]}`}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 mt-2 text-[10px] text-slate-600">
                <span><span className="text-red-400">■</span> High risk</span>
                <span><span className="text-amber-400">■</span> Medium</span>
                <span><span className="text-slate-500">■</span> Low</span>
              </div>
            </section>
          )}

          {/* Properties */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Properties</h3>
            <div className="bg-slate-800/30 border border-slate-800 rounded-xl px-4 py-1">
              <PropRow label="Users authorized" value={app.user_count} />
              <PropRow label="Admin scope" value={app.has_admin_scope ? 'Yes' : 'No'} highlight={app.has_admin_scope} />
              <PropRow label="Write scope" value={app.has_write_scope ? 'Yes' : 'No'} highlight={app.has_write_scope} />
              <PropRow label="Accesses email" value={app.accesses_email ? 'Yes' : 'No'} highlight={app.accesses_email} />
              <PropRow label="Accesses Drive/files" value={app.accesses_drive ? 'Yes' : 'No'} highlight={app.accesses_drive} />
              <PropRow label="Accesses calendar" value={app.accesses_calendar ? 'Yes' : 'No'} highlight={app.accesses_calendar} />
              <PropRow label="External domain" value={app.external_domain ? 'Yes' : 'No'} highlight={app.external_domain} />
              <PropRow label="IT verified" value={app.is_verified ? 'Yes' : 'No'} />
              <PropRow label="First seen" value={fmtDate(app.first_seen_at)} />
              <PropRow label="Last seen" value={fmtDate(app.last_seen_at)} />
              {app.developer_url && (
                <PropRow label="Developer" value={app.developer_url} />
              )}
            </div>
          </section>

          {/* Whitelist provenance */}
          {app.is_whitelisted && wlInfo && (
            <section className="bg-emerald-900/10 border border-emerald-700/20 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-emerald-300 mb-2">✓ Approval record</div>
              <div className="space-y-1 text-xs text-slate-400">
                <div><span className="text-slate-500">Approved by</span> <span className="text-slate-200">{wlInfo.approved_by_name || wlInfo.approved_by_email || 'Unknown'}</span></div>
                <div><span className="text-slate-500">Approved on</span> <span className="text-slate-200">{fmtDate(wlInfo.approved_at)}</span></div>
                {wlInfo.reason && <div><span className="text-slate-500">Reason</span> <span className="text-slate-200">"{wlInfo.reason}"</span></div>}
                {wlInfo.expires_at && <div><span className="text-slate-500">Expires</span> <span className="text-amber-300">{fmtDate(wlInfo.expires_at)}</span></div>}
              </div>
            </section>
          )}

          {/* AI tool risk panel */}
          {app.is_ai_tool && app.ai_risk_flags && (
            <section className="bg-purple-900/15 border border-purple-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <h3 className="text-sm font-semibold text-purple-300">AI Tool Risk Analysis</h3>
                <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded">{app.ai_risk_flags.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Data Training Clause', value: app.ai_risk_flags.data_training_clause ? 'Yes — ToS permits' : 'No', bad: app.ai_risk_flags.data_training_clause },
                  { label: 'Trains on Your Data', value: app.ai_risk_flags.trains_on_data ? 'Yes' : 'No', bad: app.ai_risk_flags.trains_on_data },
                  { label: 'Data Retention', value: app.ai_risk_flags.data_retention, bad: ['Unknown', 'Account lifetime'].includes(app.ai_risk_flags.data_retention) },
                  { label: 'Server Geography', value: app.ai_risk_flags.server_geography, bad: false },
                ].map(f => (
                  <div key={f.label} className={`rounded-lg p-2.5 ${f.bad ? 'bg-red-900/30 border border-red-500/20' : 'bg-slate-800/60'}`}>
                    <div className="text-slate-500 text-[10px] mb-0.5">{f.label}</div>
                    <div className={`font-medium text-xs ${f.bad ? 'text-red-300' : 'text-slate-300'}`}>{f.value}</div>
                  </div>
                ))}
              </div>
              {app.ai_risk_flags.notes && (
                <p className="text-xs text-purple-300/70 leading-relaxed border-t border-purple-500/20 pt-2">{app.ai_risk_flags.notes}</p>
              )}
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-slate-800 px-6 py-4 space-y-3">
          {/* Approve with reason input */}
          {!app.is_whitelisted && showReason && (
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for approval (optional)"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (!nudgeSent) nudgeMutation.mutate(); }}
              disabled={nudgeMutation.isPending || nudgeSent}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-colors flex-1 justify-center ${nudgeSent ? 'bg-blue-600/20 text-blue-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'} disabled:opacity-50`}
            >
              {nudgeSent ? '✓ Nudge sent' : nudgeMutation.isPending ? 'Sending…' : '📣 Nudge IT'}
            </button>

            {app.is_whitelisted ? (
              <button
                onClick={() => wlMutation.mutate()}
                disabled={wlMutation.isPending}
                className="flex-1 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {wlMutation.isPending ? 'Removing…' : 'Remove Approval'}
              </button>
            ) : showReason ? (
              <button
                onClick={() => wlMutation.mutate()}
                disabled={wlMutation.isPending}
                className="flex-1 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {wlMutation.isPending ? 'Approving…' : 'Confirm Approve'}
              </button>
            ) : (
              <button
                onClick={() => setShowReason(true)}
                className="flex-1 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
              >
                ✓ Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
