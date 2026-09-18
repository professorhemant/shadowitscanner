import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkspace } from '../api/workspaces';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'slack',     label: '💬 Slack' },
  { id: 'google',    label: '📁 Google Workspace' },
  { id: 'microsoft', label: '🪟 Microsoft 365' },
  { id: 'okta',      label: '🔐 Okta' },
];

export default function ConnectWorkspace() {
  const [type, setType] = useState('slack');
  const [form, setForm] = useState({
    name: '',
    slack_bot_token: '', slack_user_token: '',
    google_domain: '', google_admin_email: '',
    ms_tenant_id: '', ms_client_id: '', ms_client_secret: '',
    okta_domain: '', okta_api_token: '',
  });
  const [saFile, setSaFile] = useState(null);
  const [error, setError] = useState('');
  const qc = useQueryClient();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async (data) => createWorkspace(data),
    onSuccess: () => { qc.invalidateQueries(['workspaces']); navigate('/dashboard'); },
    onError: (err) => setError(err.response?.data?.message || 'Failed to connect workspace'),
  });

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    const payload = { ...form, type };
    if (type === 'google' && saFile) {
      const text = await saFile.text();
      payload.google_service_account = JSON.parse(text);
    }
    mutation.mutate(payload);
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Connect Workspace</h1>
      <p className="text-slate-400 text-sm mb-6">Connect Slack, Google Workspace, or Microsoft 365 to start scanning for shadow IT.</p>

      {/* Type toggle */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setType(t.id)}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${type === t.id ? 'bg-brand-600 text-white' : 'bg-surface-card text-slate-400 border border-surface-border hover:border-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm text-slate-400 mb-1">Workspace name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required
            placeholder="My Company Workspace"
            className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
        </div>

        {type === 'slack' && (
          <>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Bot Token <span className="text-slate-600">(xoxb-...)</span></label>
              <input type="password" value={form.slack_bot_token} onChange={e => set('slack_bot_token', e.target.value)} required
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">User/Admin Token <span className="text-slate-600">(xoxp-... for admin.apps access)</span></label>
              <input type="password" value={form.slack_user_token} onChange={e => set('slack_user_token', e.target.value)}
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
              <p className="text-xs text-slate-600 mt-1">Required for Enterprise Grid admin.apps API. Optional for standard workspaces.</p>
            </div>
          </>
        )}

        {type === 'google' && (
          <>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Domain</label>
              <input type="text" value={form.google_domain} onChange={e => set('google_domain', e.target.value)} required
                placeholder="company.com"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Admin email</label>
              <input type="email" value={form.google_admin_email} onChange={e => set('google_admin_email', e.target.value)} required
                placeholder="admin@company.com"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Service Account JSON key</label>
              <input type="file" accept=".json" onChange={e => setSaFile(e.target.files[0])} required
                className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-slate-300 file:text-xs cursor-pointer" />
              <p className="text-xs text-slate-600 mt-1">Must have Admin SDK Reports API + domain-wide delegation configured.</p>
            </div>
          </>
        )}

        {type === 'microsoft' && (
          <>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 text-xs text-blue-300 space-y-1">
              <p className="font-medium">Setup required in Azure Portal:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-400">
                <li>Register an App in <strong>Azure AD → App registrations</strong></li>
                <li>Add API permissions: <code>Application.Read.All</code>, <code>Directory.Read.All</code>, <code>User.Read.All</code> (Application type)</li>
                <li>Click <strong>Grant admin consent</strong></li>
                <li>Create a <strong>Client secret</strong> under Certificates &amp; secrets</li>
              </ol>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tenant ID <span className="text-slate-600">(Directory ID)</span></label>
              <input type="text" value={form.ms_tenant_id} onChange={e => set('ms_tenant_id', e.target.value)} required
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Client ID <span className="text-slate-600">(Application ID)</span></label>
              <input type="text" value={form.ms_client_id} onChange={e => set('ms_client_id', e.target.value)} required
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Client Secret</label>
              <input type="password" value={form.ms_client_secret} onChange={e => set('ms_client_secret', e.target.value)} required
                placeholder="Your app's client secret value"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
              <p className="text-xs text-slate-600 mt-1">Stored encrypted. Scans all OAuth apps authorized by users in your tenant.</p>
            </div>
          </>
        )}

        {type === 'okta' && (
          <>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-3 text-xs text-orange-300 space-y-1">
              <p className="font-medium">Setup required in Okta Admin Console:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-orange-400">
                <li>Go to <strong>Security → API → Tokens</strong></li>
                <li>Click <strong>Create Token</strong> — name it "ShadowIT Scanner"</li>
                <li>Copy the token value (shown once only)</li>
                <li>Your Okta domain is the URL you use to log in (e.g. <code>company.okta.com</code>)</li>
              </ol>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Okta Domain <span className="text-slate-600">(without https://)</span></label>
              <input type="text" value={form.okta_domain} onChange={e => set('okta_domain', e.target.value)} required
                placeholder="company.okta.com"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">API Token</label>
              <input type="password" value={form.okta_api_token} onChange={e => set('okta_api_token', e.target.value)} required
                placeholder="Your Okta API token"
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
              <p className="text-xs text-slate-600 mt-1">Read-only token. Scans all SSO apps (SAML + OIDC + provisioned) in your org.</p>
            </div>
          </>
        )}

        <button type="submit" disabled={mutation.isPending}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
          {mutation.isPending ? 'Connecting…' : 'Connect workspace →'}
        </button>
      </form>
    </div>
  );
}
