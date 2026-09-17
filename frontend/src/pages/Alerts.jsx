import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Alerts() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({ enabled: true, min_risk_level: 'high', email_recipients: [], notify_on_new: true });
  const [emailInput, setEmailInput] = useState('');

  const { data } = useQuery({
    queryKey: ['alert-config', activeWorkspace?.id],
    queryFn: () => client.get(`/alerts/${activeWorkspace?.id}`).then(r => r.data.config),
    enabled: !!activeWorkspace?.id,
    onSuccess: (d) => setForm({ enabled: d.enabled, min_risk_level: d.min_risk_level, email_recipients: d.email_recipients || [], notify_on_new: d.notify_on_new }),
  });

  useEffect(() => {
    if (data) setForm({ enabled: data.enabled, min_risk_level: data.min_risk_level, email_recipients: data.email_recipients || [], notify_on_new: data.notify_on_new });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => client.put(`/alerts/${activeWorkspace?.id}`, form),
    onSuccess: () => qc.invalidateQueries(['alert-config']),
  });

  const addEmail = () => {
    if (emailInput && !form.email_recipients.includes(emailInput)) {
      setForm(f => ({ ...f, email_recipients: [...f.email_recipients, emailInput] }));
      setEmailInput('');
    }
  };
  const removeEmail = (e) => setForm(f => ({ ...f, email_recipients: f.email_recipients.filter(x => x !== e) }));

  if (!activeWorkspace) return <div className="p-6 text-slate-400">Select a workspace first.</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Alert Configuration</h1>
      <p className="text-slate-400 text-sm mb-6">Get notified when new high-risk apps are discovered.</p>

      <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-200">Enable alerts</div>
            <div className="text-xs text-slate-500">Send email when risky apps are found</div>
          </div>
          <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.enabled ? 'bg-brand-600' : 'bg-slate-700'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Minimum risk level to alert</label>
          <select value={form.min_risk_level} onChange={e => setForm(f => ({ ...f, min_risk_level: e.target.value }))}
            className="bg-slate-800 border border-surface-border text-sm text-slate-300 px-3 py-2 rounded-lg focus:outline-none capitalize">
            {['critical','high','medium','low'].map(l => <option key={l} value={l} className="capitalize">{l} and above</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Email recipients</label>
          <div className="flex gap-2 mb-2">
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
              placeholder="admin@company.com"
              className="flex-1 bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
            <button onClick={addEmail} className="bg-brand-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-500 transition-colors">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.email_recipients.map(e => (
              <span key={e} className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-lg flex items-center gap-1.5">
                {e}
                <button onClick={() => removeEmail(e)} className="text-slate-500 hover:text-red-400">×</button>
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {saveMutation.isPending ? 'Saving…' : 'Save alert settings'}
        </button>
        {saveMutation.isSuccess && <span className="text-green-400 text-sm ml-3">Saved ✓</span>}
      </div>
    </div>
  );
}
