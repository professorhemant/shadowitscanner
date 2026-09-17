import RiskBadge from './RiskBadge';

export default function AppDetailModal({ app, onClose, onWhitelist }) {
  if (!app) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-card rounded-xl w-full max-w-lg border border-surface-border shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-surface-border flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{app.app_name}</h2>
            <p className="text-sm text-slate-400 capitalize">{app.source} · {app.developer || 'Unknown developer'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <RiskBadge level={app.risk_level} />
            <span className="text-2xl font-bold text-slate-200">{app.risk_score}/100</span>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Why is this risky?</h3>
            <ul className="space-y-1.5">
              {(app.risk_factors || []).map((f, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>{f.detail} <span className="text-slate-500">(+{f.weight})</span></span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">OAuth Scopes</h3>
            <div className="flex flex-wrap gap-1.5">
              {(app.scopes || []).map(s => (
                <span key={s} className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded font-mono">{s}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Users authorized', app.user_count],
              ['Verified', app.is_verified ? 'Yes' : 'No'],
              ['Accesses email', app.accesses_email ? 'Yes' : 'No'],
              ['Accesses Drive', app.accesses_drive ? 'Yes' : 'No'],
            ].map(([label, val]) => (
              <div key={label} className="bg-slate-800 rounded-lg p-3">
                <div className="text-slate-500 text-xs">{label}</div>
                <div className="text-slate-200 font-medium mt-0.5">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {!app.is_whitelisted && (
          <div className="px-6 py-4 border-t border-surface-border flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button
              onClick={() => onWhitelist(app)}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
            >
              Approve & Whitelist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
