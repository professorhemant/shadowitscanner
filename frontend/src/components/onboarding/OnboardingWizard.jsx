import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createWorkspace } from '../../api/workspaces';
import { useNavigate } from 'react-router-dom';

const SOURCES = [
  { id: 'slack',       icon: '💬', label: 'Slack',            desc: 'OAuth apps + bot installs' },
  { id: 'google',      icon: '📁', label: 'Google Workspace', desc: 'OAuth grants via Admin SDK' },
  { id: 'microsoft',   icon: '🪟', label: 'Microsoft 365',    desc: 'Azure AD OAuth apps' },
  { id: 'okta',        icon: '🔐', label: 'Okta',             desc: 'SAML + OIDC + provisioned apps' },
  { id: 'github',      icon: '🐙', label: 'GitHub',           desc: 'GitHub Apps + webhooks' },
  { id: 'jira',        icon: '🎯', label: 'Jira',             desc: 'Atlassian Connect apps' },
  { id: 'confluence',  icon: '📘', label: 'Confluence',       desc: 'Public spaces + Connect apps' },
];

const INPUT = 'w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500';

function SourceFields({ type, form, set, saFile, setSaFile }) {
  if (type === 'slack') return (
    <div className="space-y-3">
      <Field label="Bot Token (xoxb-…)">
        <input type="password" value={form.slack_bot_token} onChange={e => set('slack_bot_token', e.target.value)} required className={INPUT} placeholder="xoxb-…" />
      </Field>
      <Field label="User/Admin Token (xoxp-…)" hint="Required for Enterprise Grid admin.apps access. Optional otherwise.">
        <input type="password" value={form.slack_user_token} onChange={e => set('slack_user_token', e.target.value)} className={INPUT} placeholder="xoxp-… (optional)" />
      </Field>
    </div>
  );

  if (type === 'google') return (
    <div className="space-y-3">
      <Field label="Domain"><input type="text" value={form.google_domain} onChange={e => set('google_domain', e.target.value)} required className={INPUT} placeholder="company.com" /></Field>
      <Field label="Admin email"><input type="email" value={form.google_admin_email} onChange={e => set('google_admin_email', e.target.value)} required className={INPUT} placeholder="admin@company.com" /></Field>
      <Field label="Service Account JSON key" hint="Must have Admin SDK Reports API + domain-wide delegation.">
        <input type="file" accept=".json" onChange={e => setSaFile(e.target.files[0])} required className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-300 file:text-xs cursor-pointer" />
      </Field>
    </div>
  );

  if (type === 'microsoft') return (
    <div className="space-y-3">
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2 text-xs text-blue-300">
        Azure AD App Registration required — see <strong>/connect</strong> page for full setup guide.
      </div>
      <Field label="Tenant ID"><input type="text" value={form.ms_tenant_id} onChange={e => set('ms_tenant_id', e.target.value)} required className={INPUT + ' font-mono'} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></Field>
      <Field label="Client ID"><input type="text" value={form.ms_client_id} onChange={e => set('ms_client_id', e.target.value)} required className={INPUT + ' font-mono'} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></Field>
      <Field label="Client Secret"><input type="password" value={form.ms_client_secret} onChange={e => set('ms_client_secret', e.target.value)} required className={INPUT} placeholder="Client secret value" /></Field>
    </div>
  );

  if (type === 'okta') return (
    <div className="space-y-3">
      <Field label="Okta Domain"><input type="text" value={form.okta_domain} onChange={e => set('okta_domain', e.target.value)} required className={INPUT + ' font-mono'} placeholder="company.okta.com" /></Field>
      <Field label="API Token" hint="Security → API → Tokens in Okta Admin Console.">
        <input type="password" value={form.okta_api_token} onChange={e => set('okta_api_token', e.target.value)} required className={INPUT} placeholder="API token" />
      </Field>
    </div>
  );

  if (type === 'github') return (
    <div className="space-y-3">
      <Field label="GitHub Organization"><input type="text" value={form.github_org} onChange={e => set('github_org', e.target.value)} required className={INPUT + ' font-mono'} placeholder="my-company" /></Field>
      <Field label="Personal Access Token" hint="Scopes: read:org, admin:org_hook, repo">
        <input type="password" value={form.github_pat} onChange={e => set('github_pat', e.target.value)} required className={INPUT} placeholder="ghp_…" />
      </Field>
    </div>
  );

  if (type === 'jira') return (
    <div className="space-y-3">
      <Field label="Jira Domain"><input type="text" value={form.jira_domain} onChange={e => set('jira_domain', e.target.value)} required className={INPUT + ' font-mono'} placeholder="company.atlassian.net" /></Field>
      <Field label="Admin Email"><input type="email" value={form.jira_email} onChange={e => set('jira_email', e.target.value)} required className={INPUT} placeholder="admin@company.com" /></Field>
      <Field label="API Token" hint="Atlassian account settings → Security → API tokens.">
        <input type="password" value={form.jira_api_token} onChange={e => set('jira_api_token', e.target.value)} required className={INPUT} placeholder="API token" />
      </Field>
    </div>
  );

  if (type === 'confluence') return (
    <div className="space-y-3">
      <Field label="Confluence Domain"><input type="text" value={form.confluence_domain} onChange={e => set('confluence_domain', e.target.value)} required className={INPUT + ' font-mono'} placeholder="company.atlassian.net" /></Field>
      <Field label="Admin Email"><input type="email" value={form.confluence_email} onChange={e => set('confluence_email', e.target.value)} required className={INPUT} placeholder="admin@company.com" /></Field>
      <Field label="API Token" hint="Atlassian account settings → Security → API tokens.">
        <input type="password" value={form.confluence_api_token} onChange={e => set('confluence_api_token', e.target.value)} required className={INPUT} placeholder="API token" />
      </Field>
    </div>
  );

  return null;
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

export default function OnboardingWizard({ onDismiss }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('slack');
  const [wsName, setWsName] = useState('');
  const [form, setFormState] = useState({
    slack_bot_token: '', slack_user_token: '',
    google_domain: '', google_admin_email: '',
    ms_tenant_id: '', ms_client_id: '', ms_client_secret: '',
    okta_domain: '', okta_api_token: '',
    github_org: '', github_pat: '',
    jira_domain: '', jira_email: '', jira_api_token: '',
    confluence_domain: '', confluence_email: '', confluence_api_token: '',
  });
  const [saFile, setSaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectedWs, setConnectedWs] = useState(null);

  const qc = useQueryClient();
  const navigate = useNavigate();

  const set = (k, v) => setFormState(f => ({ ...f, [k]: v }));

  const src = SOURCES.find(s => s.id === type);

  async function handleConnect(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, type, name: wsName || `My ${src.label} Workspace` };
      if (type === 'google' && saFile) {
        const text = await saFile.text();
        payload.google_service_account = JSON.parse(text);
      }
      const r = await createWorkspace(payload);
      await qc.invalidateQueries(['workspaces']);
      setConnectedWs(r.data.workspace || { name: payload.name, type });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    localStorage.setItem('shadow_onboarding_done', '1');
    onDismiss();
    navigate('/dashboard');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative bg-[#0f172a] border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors z-10"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 rounded-full transition-all duration-300 ${n === step ? 'w-8 bg-brand-500' : n < step ? 'w-4 bg-brand-700' : 'w-4 bg-slate-700'}`} />
          ))}
        </div>

        {/* ── Step 1: Welcome ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="px-8 py-6 text-center space-y-6">
            <div className="text-6xl">🛡️</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome to Shadow IT Scanner</h1>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Discover every app connected to your workspace in minutes.
                Find shadow AI tools, risky OAuth grants, and unapproved software — before your next audit.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              {[
                { icon: '🔍', title: 'Discover', desc: 'All OAuth-connected apps across Google, Microsoft, Slack & more' },
                { icon: '⚠️', title: 'Assess', desc: 'Risk scores, scope analysis, AI tool detection, breach alerts' },
                { icon: '✅', title: 'Control', desc: 'Approve, whitelist, nudge employees, generate compliance reports' },
              ].map(c => (
                <div key={c.title} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-xs font-semibold text-white mb-0.5">{c.title}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{c.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
            >
              Get started →
            </button>
            <button onClick={onDismiss} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              I'll set it up later
            </button>
          </div>
        )}

        {/* ── Step 2: Connect workspace ───────────────────────────────────── */}
        {step === 2 && (
          <div className="px-8 py-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Connect your workspace</h2>
              <p className="text-slate-400 text-sm mt-1">Pick your identity provider or collaboration tool.</p>
            </div>

            {/* Source tiles */}
            <div className="grid grid-cols-4 gap-2">
              {SOURCES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setType(s.id)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-colors ${
                    type === s.id
                      ? 'border-brand-500 bg-brand-900/20 text-white'
                      : 'border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Selected source info */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{src.icon} {src.label}</span> — {src.desc}
            </div>

            <form onSubmit={handleConnect} className="space-y-3">
              {/* Workspace name */}
              <Field label="Workspace name">
                <input
                  type="text"
                  value={wsName}
                  onChange={e => setWsName(e.target.value)}
                  placeholder={`My ${src.label} Workspace`}
                  className={INPUT}
                />
              </Field>

              <SourceFields type={type} form={form} set={set} saFile={saFile} setSaFile={setSaFile} />

              {error && (
                <div className="bg-red-900/30 border border-red-700/30 text-red-400 text-xs rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Connecting…' : `Connect ${src.label} →`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: Success ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="px-8 py-10 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {connectedWs?.name || 'Workspace'} connected!
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Shadow IT Scanner is ready to scan your{' '}
                <span className="text-white font-medium capitalize">{connectedWs?.type || type}</span> workspace.
                Head to the dashboard to run your first scan and see what apps your team is using.
              </p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-left space-y-2">
              <div className="text-xs font-semibold text-slate-300 mb-2">What happens next</div>
              {[
                '🔍 Run a scan to discover all connected apps',
                '⚠️ Review apps by risk score and category',
                '✅ Approve trusted apps, flag suspicious ones',
                '📄 Export a compliance report for your next audit',
              ].map(s => (
                <div key={s} className="text-xs text-slate-400">{s}</div>
              ))}
            </div>

            <button
              onClick={handleDone}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
