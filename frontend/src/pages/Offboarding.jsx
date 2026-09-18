import { useState, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getChecklist } from '../api/offboarding';

const PRIORITY_STYLES = {
  critical: { header: 'bg-red-900/30 border-red-700/50 text-red-300', badge: 'bg-red-500/20 text-red-300 border border-red-600/40', dot: 'bg-red-400' },
  high:     { header: 'bg-orange-900/20 border-orange-700/40 text-orange-300', badge: 'bg-orange-500/20 text-orange-300 border border-orange-600/40', dot: 'bg-orange-400' },
  medium:   { header: 'bg-slate-700/40 border-slate-600/40 text-slate-300', badge: 'bg-slate-600/40 text-slate-300 border border-slate-500/40', dot: 'bg-slate-400' },
};

const RISK_COLOR = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-blue-400',
  low: 'text-green-400',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ChecklistItem({ item, index }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className={`flex gap-3 py-3 border-b border-surface-border last:border-0 transition-opacity ${checked ? 'opacity-50' : ''}`}>
      <button
        onClick={() => setChecked(c => !c)}
        className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 hover:border-brand-500'
        }`}
      >
        {checked && <span className="text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${checked ? 'line-through text-slate-500' : 'text-white'}`}>
            {item.app_name}
          </span>
          {item.confirmed_for_user && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-600/40">
              CONFIRMED
            </span>
          )}
          {item.is_ai_tool && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">AI</span>
          )}
          {item.has_admin_scope && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300">Admin</span>
          )}
          <span className={`text-[10px] font-semibold ${RISK_COLOR[item.risk_level] || 'text-slate-400'}`}>
            {item.risk_level?.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-500">via {item.source}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.revoke_note}</p>
        {item.scopes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.scopes.slice(0, 4).map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400">{s}</span>
            ))}
            {item.scopes.length > 4 && <span className="text-[10px] text-slate-600">+{item.scopes.length - 4} more</span>}
          </div>
        )}
      </div>
      <span className="shrink-0 text-xs text-slate-600 tabular-nums self-start mt-0.5">#{index + 1}</span>
    </div>
  );
}

export default function Offboarding() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const printRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!activeWorkspace) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res = await getChecklist(activeWorkspace.id, email.trim());
      setData(res.data);
      setSubmitted(email.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate checklist');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print styles injected globally when this page mounts */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #offboarding-print { display: block !important; }
          @page { margin: 20mm; size: A4; }
          .no-print { display: none !important; }
          .print-section { break-inside: avoid; }
        }
        #offboarding-print { display: none; }
      `}</style>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Offboarding Checklist</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enter a departing employee's email to generate a prioritized IT revocation checklist for every app in your workspace.
          </p>
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-xl p-5 mb-6 no-print">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1.5">Departing employee email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane.smith@company.com"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !activeWorkspace}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate Checklist →'}
            </button>
          </div>
          {!activeWorkspace && <p className="text-amber-400 text-xs mt-2">Select a workspace first.</p>}
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <p className="text-slate-600 text-xs mt-2">
            Leave email blank to generate a full workspace app inventory checklist.
          </p>
        </form>

        {data && (
          <>
            {/* Actions bar */}
            <div className="flex items-center justify-between mb-4 no-print">
              <div className="text-sm text-slate-400">
                {data.summary.total_apps} apps across {data.sections.length} priority groups
                {data.summary.confirmed_count > 0 && (
                  <span className="ml-2 text-yellow-300 font-medium">· {data.summary.confirmed_count} confirmed for this user</span>
                )}
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                🖨️ Print / Save PDF
              </button>
            </div>

            {/* Checklist */}
            <div ref={printRef}>
              {/* Print header */}
              <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-300">
                <div className="text-2xl font-bold text-slate-900">IT Offboarding Checklist</div>
                {submitted && <div className="text-slate-600 mt-1">Employee: <strong>{submitted}</strong></div>}
                <div className="text-slate-600">Workspace: <strong>{data.workspace.name}</strong></div>
                <div className="text-slate-500 text-sm mt-1">Generated: {formatDate(data.generated_at)}</div>
              </div>

              {/* Screen header */}
              <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white font-semibold text-lg">
                      {submitted ? `Offboarding: ${submitted}` : 'Full Workspace Checklist'}
                    </div>
                    <div className="text-slate-400 text-sm mt-0.5">{data.workspace.name} · {formatDate(data.generated_at)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                      <div className="text-red-400 font-bold text-lg">{data.summary.admin_scope}</div>
                      <div className="text-slate-500 text-xs">Admin access</div>
                    </div>
                    <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2">
                      <div className="text-orange-400 font-bold text-lg">{data.summary.email_calendar_drive}</div>
                      <div className="text-slate-500 text-xs">Email/Drive</div>
                    </div>
                  </div>
                </div>

                {data.summary.confirmed_count > 0 && (
                  <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-300 text-xs">
                    🔍 {data.summary.confirmed_count} app{data.summary.confirmed_count !== 1 ? 's' : ''} found referencing <strong>{submitted}</strong> in scan data — marked CONFIRMED.
                  </div>
                )}
              </div>

              {/* Priority sections */}
              {data.sections.map(section => {
                const style = PRIORITY_STYLES[section.priority] || PRIORITY_STYLES.medium;
                return (
                  <div key={section.id} className="mb-4 print-section">
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl border ${style.header}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                      <span className="font-semibold text-sm">{section.label}</span>
                      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${style.badge}`}>
                        {section.priority.toUpperCase()} PRIORITY — {section.items.length} app{section.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="bg-surface-card border border-t-0 border-surface-border rounded-b-xl px-4">
                      {section.items.map((item, i) => (
                        <ChecklistItem key={item.app_id} item={item} index={i} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Compliance footer */}
              <div className="mt-4 p-4 bg-slate-800/40 border border-surface-border rounded-xl text-xs text-slate-500">
                <strong className="text-slate-400">Offboarding compliance notes:</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>Revoke access in each system <strong>before</strong> disabling the corporate SSO/IdP account to avoid lockouts during handoff.</li>
                  <li>Transfer ownership of shared resources (documents, repos, boards) before removing the user.</li>
                  <li>Archive or export any data owned solely by this user that may be needed for compliance.</li>
                  <li>If the user had admin rights on any system, rotate any shared credentials or API keys they had access to.</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {!data && !loading && (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">📋</div>
            <div className="text-slate-300 font-medium">Enter an employee email above</div>
            <div className="text-sm mt-1">or leave blank for a full workspace app inventory</div>
          </div>
        )}
      </div>

      {/* Hidden print-only version */}
      <div id="offboarding-print" />
    </>
  );
}
