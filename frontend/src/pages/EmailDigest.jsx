import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDigestSettings, updateDigestSettings, sendTestDigest, getDigestPreview } from '../api/digest';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useToastStore } from '../store/toastStore';

const FREQUENCIES = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i === 0 ? '12' : i > 12 ? i - 12 : i}:00 ${i < 12 ? 'AM' : 'PM'}`,
}));

function fmtNext(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function EmailDigest() {
  const { activeWorkspace } = useWorkspaceStore();
  const addToast = useToastStore(s => s.addToast);
  const qc = useQueryClient();
  const wsId = activeWorkspace?.id;

  const [form, setForm] = useState({
    digest_enabled:   false,
    digest_email:     '',
    digest_frequency: 'weekly',
    digest_day:       1,
    digest_hour:      9,
  });
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['digest-settings', wsId],
    queryFn: () => getDigestSettings(wsId).then(r => r.data),
    enabled: !!wsId,
  });

  const { data: preview } = useQuery({
    queryKey: ['digest-preview', wsId],
    queryFn: () => getDigestPreview(wsId).then(r => r.data),
    enabled: !!wsId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        digest_enabled:   settings.digest_enabled   ?? false,
        digest_email:     settings.digest_email     ?? '',
        digest_frequency: settings.digest_frequency ?? 'weekly',
        digest_day:       settings.digest_day       ?? 1,
        digest_hour:      settings.digest_hour      ?? 9,
      });
      setDirty(false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => updateDigestSettings({ workspace_id: wsId, ...form }),
    onSuccess: (res) => {
      qc.invalidateQueries(['digest-settings', wsId]);
      addToast('Digest settings saved', 'success');
      setDirty(false);
    },
    onError: () => addToast('Failed to save settings', 'error'),
  });

  async function handleTest() {
    if (!wsId || testing) return;
    setTesting(true);
    try {
      const res = await sendTestDigest(wsId);
      addToast(`Test digest sent to ${res.data.sent_to}`, 'success');
    } catch (e) {
      addToast(e.response?.data?.error || 'Failed to send test', 'error');
    } finally {
      setTesting(false);
    }
  }

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setDirty(true);
  }

  if (!wsId) return (
    <div className="p-6 text-slate-400">Select a workspace first.</div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Email Digest</h1>
        <p className="text-slate-400 text-sm mt-1">Receive a scheduled HTML summary of your Shadow IT risk posture.</p>
      </div>

      {/* Preview stats */}
      {preview && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Apps',  value: preview.total,    color: 'text-slate-200' },
            { label: 'Critical',    value: preview.critical, color: 'text-red-400' },
            { label: 'High',        value: preview.high,     color: 'text-orange-400' },
            { label: 'Medium',      value: preview.medium,   color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-surface-card border border-surface-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Settings card */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Digest Settings</h2>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">Enable Email Digest</div>
            <div className="text-xs text-slate-500 mt-0.5">Send scheduled HTML summaries to your inbox</div>
          </div>
          <button
            onClick={() => set('digest_enabled', !form.digest_enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.digest_enabled ? 'bg-brand-600' : 'bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.digest_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <hr className="border-surface-border" />

        {/* Recipient email */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Recipient Email</label>
          <input
            type="email"
            value={form.digest_email}
            onChange={e => set('digest_email', e.target.value)}
            placeholder="security@yourcompany.com"
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Frequency</label>
          <div className="flex gap-2">
            {FREQUENCIES.map(f => (
              <button
                key={f.value}
                onClick={() => set('digest_frequency', f.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.digest_frequency === f.value ? 'bg-brand-600/20 border-brand-500 text-brand-400' : 'bg-surface border-surface-border text-slate-400 hover:border-slate-500'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day selector (weekly = day of week, monthly = day of month) */}
        <div className="grid grid-cols-2 gap-4">
          {form.digest_frequency === 'weekly' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Day of Week</label>
              <select
                value={form.digest_day}
                onChange={e => set('digest_day', Number(e.target.value))}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
              >
                {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          )}
          {form.digest_frequency === 'monthly' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Day of Month</label>
              <select
                value={form.digest_day}
                onChange={e => set('digest_day', Number(e.target.value))}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Send Time (UTC)</label>
            <select
              value={form.digest_hour}
              onChange={e => set('digest_hour', Number(e.target.value))}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>

        {/* Next send info */}
        {settings?.digest_next_send && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-surface rounded-lg px-3 py-2">
            <span>🕐</span>
            <span>Next digest: <span className="text-slate-300">{fmtNext(settings.digest_next_send)}</span></span>
            {settings.digest_last_sent && (
              <span className="ml-auto">Last sent: {fmtNext(settings.digest_last_sent)}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isLoading}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 transition-colors"
          >
            {saveMutation.isLoading ? 'Saving…' : 'Save Settings'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !form.digest_email}
            className="px-4 py-2 bg-surface border border-surface-border hover:border-slate-500 text-slate-300 text-sm font-medium rounded-lg disabled:opacity-40 transition-colors"
          >
            {testing ? '⟳ Sending…' : '📧 Send Test Digest'}
          </button>
        </div>
      </div>

      {/* What's included card */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">What's in the Digest</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: '📊', text: 'Risk summary: total, critical, high, new apps' },
            { icon: '⚠️', text: 'Top 7 unapproved critical & high-risk apps' },
            { icon: '✅', text: 'Apps approved since last digest' },
            { icon: '🔴', text: 'Critical alert banner when action needed' },
            { icon: '🔗', text: 'Direct link to review apps in dashboard' },
            { icon: '📅', text: 'Period coverage (since last digest)' },
          ].map(i => (
            <div key={i.text} className="flex items-start gap-2 text-slate-400">
              <span className="text-base mt-0.5">{i.icon}</span>
              <span>{i.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
