import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getSlackBotConfig, configureSlackBot, testSlackWebhook, sendDigestNow } from '../api/slackBot';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${h}:00 ${ampm} UTC` };
});

function StatusBadge({ ok, label }) {
  return ok
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-700/30">● {label}</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-500 border border-slate-600/30">○ {label}</span>;
}

function DigestPreview() {
  return (
    <div className="bg-[#1a1d21] border border-[#383a40] rounded-xl p-4 font-mono text-xs leading-relaxed">
      {/* Slack-style message preview */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center text-sm shrink-0">🛡️</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm">Shadow IT Scanner</span>
            <span className="text-[10px] text-slate-500 bg-slate-700 px-1 rounded">App</span>
            <span className="text-[10px] text-slate-600">Today at 9:00 AM</span>
          </div>

          {/* Header block */}
          <div className="bg-[#222529] rounded-t-lg px-3 py-2 border-l-4 border-brand-500">
            <div className="font-bold text-white text-sm">🛡️ Shadow IT Digest — Acme Corp</div>
          </div>

          {/* Context */}
          <div className="bg-[#222529] px-3 py-1 text-slate-500 text-[10px]">
            <em>Monday, Sep 18 · Weekly summary of new app activity</em>
          </div>

          <div className="bg-[#222529] h-px" />

          {/* New apps section */}
          <div className="bg-[#222529] px-3 py-2">
            <div className="text-white font-semibold mb-1">📋 New Apps This Week — 3 discovered · 🤖 2 AI tools</div>
            <div className="text-slate-300 space-y-0.5">
              <div>🔴 <span className="font-medium">ChatGPT</span> (critical) via google</div>
              <div>🟠 <span className="font-medium">Notion</span> (high) via google</div>
              <div>🟡 <span className="font-medium">Loom</span> (medium) via google</div>
            </div>
          </div>

          <div className="bg-[#222529] h-px" />

          {/* Critical alert */}
          <div className="bg-[#222529] px-3 py-2">
            <div className="text-white font-semibold mb-1">🚨 New Critical-Risk Apps (24h)</div>
            <div className="text-slate-300">
              🔴 <span className="font-medium">ChatGPT</span> — score 85 · OpenAI
            </div>
          </div>

          <div className="bg-[#222529] h-px" />

          {/* Pending */}
          <div className="bg-[#222529] px-3 py-2">
            <div className="text-white font-semibold mb-1">📋 Pending Whitelist Requests</div>
            <div className="text-slate-300">2 requests awaiting IT review.</div>
          </div>

          <div className="bg-[#222529] h-px" />

          {/* Footer */}
          <div className="bg-[#222529] rounded-b-lg px-3 py-1.5 text-slate-500 text-[10px]">
            <em>This week: 3 new · 🔴 1 critical · 🟠 1 high · 🤖 2 AI tools · 📋 2 pending approvals | Shadow IT Scanner</em>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SlackBot() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ webhook_url: '', channel: '#it-alerts', enabled: false, digest_hour: 9 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    getSlackBotConfig(activeWorkspace.id)
      .then(r => {
        setConfig(r.data);
        setForm(f => ({
          ...f,
          channel: r.data.slack_digest_channel || '#it-alerts',
          enabled: r.data.slack_digest_enabled,
          digest_hour: r.data.slack_digest_hour ?? 9,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  function flash(type, msg) {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!activeWorkspace) return;
    setSaving(true);
    try {
      await configureSlackBot({
        workspace_id: activeWorkspace.id,
        webhook_url: form.webhook_url || undefined,
        channel: form.channel,
        enabled: form.enabled,
        digest_hour: form.digest_hour,
      });
      setConfig(c => ({ ...c, slack_digest_enabled: form.enabled, slack_digest_hour: form.digest_hour, has_webhook: c?.has_webhook || !!form.webhook_url }));
      flash('success', 'Configuration saved.');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!activeWorkspace) return;
    setTesting(true);
    try {
      await testSlackWebhook(activeWorkspace.id);
      flash('success', 'Test message sent! Check your Slack channel.');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Test failed — check your webhook URL');
    } finally {
      setTesting(false);
    }
  }

  async function handleSendNow() {
    if (!activeWorkspace) return;
    setSending(true);
    try {
      await sendDigestNow(activeWorkspace.id);
      flash('success', 'Digest sent to Slack!');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Failed to send digest');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Slack Bot</h1>
        <p className="text-slate-400 text-sm mt-1">
          Send daily IT digests to a Slack channel — new apps, critical risks, and pending approvals.
        </p>
      </div>

      {!activeWorkspace && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5 text-amber-300 text-sm">
          Select a workspace to configure the Slack bot.
        </div>
      )}

      {activeWorkspace && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: config */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Status</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge ok={config?.has_webhook} label="Webhook configured" />
                <StatusBadge ok={config?.slack_digest_enabled} label="Digest enabled" />
                {config?.slack_digest_enabled && (
                  <span className="text-xs text-slate-500">
                    Sends at {HOURS[config?.slack_digest_hour ?? 9]?.label}
                  </span>
                )}
              </div>
            </div>

            {/* Setup steps */}
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Setup</h2>
              <ol className="space-y-3 text-xs text-slate-400">
                {[
                  { n: 1, text: 'Go to api.slack.com/apps → Create New App → From Scratch' },
                  { n: 2, text: 'Under "Features", click "Incoming Webhooks" → Activate' },
                  { n: 3, text: 'Click "Add New Webhook to Workspace" → Select your #it-alerts channel' },
                  { n: 4, text: 'Copy the Webhook URL and paste it below' },
                ].map(s => (
                  <li key={s.n} className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{s.n}</span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Config form */}
            <form onSubmit={handleSave} className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Configuration</h2>

              {status && (
                <div className={`text-xs px-3 py-2 rounded-lg border ${status.type === 'success' ? 'bg-green-500/10 border-green-600/30 text-green-400' : 'bg-red-500/10 border-red-600/30 text-red-400'}`}>
                  {status.msg}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={form.webhook_url}
                  onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))}
                  placeholder={config?.has_webhook ? '(saved — paste new URL to update)' : 'https://hooks.slack.com/services/T.../B.../...'}
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Channel name (optional, for reference)</label>
                <input
                  type="text"
                  value={form.channel}
                  onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  placeholder="#it-alerts"
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Daily digest time (UTC)</label>
                <select
                  value={form.digest_hour}
                  onChange={e => setForm(f => ({ ...f, digest_hour: parseInt(e.target.value) }))}
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${form.enabled ? 'bg-brand-600' : 'bg-slate-600'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-slate-300">Enable daily digest</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save configuration'}
                </button>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !config?.has_webhook}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {testing ? '…' : '🔔 Test'}
                </button>
              </div>

              {config?.has_webhook && (
                <button
                  type="button"
                  onClick={handleSendNow}
                  disabled={sending}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending…' : '📤 Send digest now'}
                </button>
              )}
            </form>
          </div>

          {/* Right: digest preview */}
          <div>
            <div className="bg-surface-card border border-surface-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Digest Preview</h2>
              <p className="text-xs text-slate-500 mb-4">This is what the daily digest looks like in Slack.</p>
              <DigestPreview />
            </div>

            <div className="bg-surface-card border border-surface-border rounded-xl p-5 mt-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">What's included</h2>
              <div className="space-y-2.5 text-xs text-slate-400">
                {[
                  { icon: '📋', text: 'New apps discovered in the last 7 days (top 5 by risk)' },
                  { icon: '🚨', text: 'New critical-risk apps in the last 24 hours' },
                  { icon: '🤖', text: 'Count of AI tools among new discoveries' },
                  { icon: '📋', text: 'Pending whitelist / approval requests awaiting IT review' },
                  { icon: '📊', text: 'Weekly summary counts (critical, high, AI tools, approvals)' },
                ].map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span>{i.icon}</span>
                    <span>{i.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
