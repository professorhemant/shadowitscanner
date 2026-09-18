import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { listWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook, getDeliveries } from '../api/webhooks';

const ALL_EVENTS = ['app.critical', 'app.high', 'app.discovered', 'scan.completed', 'app.whitelisted'];
const EVENT_DESC = {
  'app.critical': 'New critical-risk app discovered',
  'app.high': 'New high-risk app discovered',
  'app.discovered': 'Any new app discovered (high volume)',
  'scan.completed': 'Scan run finished',
  'app.whitelisted': 'App added to whitelist',
};
const EVENT_COLOR = {
  'app.critical': 'text-red-400 bg-red-900/20 border-red-700/30',
  'app.high': 'text-orange-400 bg-orange-900/20 border-orange-700/30',
  'app.discovered': 'text-blue-400 bg-blue-900/20 border-blue-700/30',
  'scan.completed': 'text-green-400 bg-green-900/20 border-green-700/30',
  'app.whitelisted': 'text-slate-400 bg-slate-700/30 border-slate-600/30',
};
const SIEM_PRESETS = [
  { label: 'Splunk HEC', url: 'https://your-splunk:8088/services/collector/event', hint: 'Set Authorization: Splunk <HEC-token> in Splunk HTTP Event Collector settings' },
  { label: 'Datadog Logs', url: 'https://http-intake.logs.datadoghq.com/api/v2/logs', hint: 'Add DD-API-KEY header in your Datadog integration' },
  { label: 'PagerDuty Events', url: 'https://events.pagerduty.com/v2/enqueue', hint: 'Use your PagerDuty Events v2 routing key as the secret' },
  { label: 'Custom endpoint', url: '', hint: 'Any HTTPS endpoint that accepts POST JSON' },
];

function EventBadge({ event }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${EVENT_COLOR[event] || 'text-slate-400 bg-slate-700/30 border-slate-600/30'}`}>
      {event}
    </span>
  );
}

function DeliveryLog({ webhookId, onClose }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    getDeliveries(webhookId).then(r => setRows(r.data.deliveries)).catch(() => setRows([]));
  }, [webhookId]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-surface-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h3 className="font-semibold text-white">Delivery Log</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {rows === null ? <div className="text-center text-slate-500 py-8">Loading…</div> :
           rows.length === 0 ? <div className="text-center text-slate-500 py-8">No deliveries yet.</div> : (
            <div className="space-y-2">
              {rows.map(d => (
                <div key={d.id} className={`rounded-lg border px-3 py-2.5 text-xs ${d.status === 'success' ? 'border-green-700/30 bg-green-900/10' : 'border-red-700/30 bg-red-900/10'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={d.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                        {d.status === 'success' ? '✓' : '✗'} {d.status}
                      </span>
                      <EventBadge event={d.event_type} />
                      {d.response_code && <span className="text-slate-500">HTTP {d.response_code}</span>}
                      {d.duration_ms && <span className="text-slate-600">{d.duration_ms}ms</span>}
                    </div>
                    <span className="text-slate-600">{new Date(d.created_at).toLocaleString()}</span>
                  </div>
                  {d.error_message && <div className="text-red-400/80 mt-1">{d.error_message}</div>}
                  {d.response_body && <div className="text-slate-600 mt-1 font-mono truncate">{d.response_body}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateModal({ workspaceId, allEvents, onCreated, onClose }) {
  const [form, setForm] = useState({ name: '', url: '', events: ['app.critical', 'app.high'] });
  const [preset, setPreset] = useState(3);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [err, setErr] = useState('');

  function toggleEvent(ev) {
    setForm(f => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter(e => e !== ev) : [...f.events, ev],
    }));
  }

  async function handleCreate() {
    if (!form.name || !form.url) { setErr('Name and URL are required'); return; }
    setSaving(true); setErr('');
    try {
      const res = await createWebhook({ workspace_id: workspaceId, ...form });
      setCreated(res.data);
      onCreated();
    } catch (e) {
      setErr(e.response?.data?.message || 'Create failed');
    } finally { setSaving(false); }
  }

  if (created) return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-surface-border rounded-xl w-full max-w-lg p-6">
        <div className="text-green-400 font-semibold mb-3">✓ Webhook created</div>
        <p className="text-sm text-slate-400 mb-3">
          Save this secret now — it will not be shown again. Use it to verify the <code className="text-brand-400">X-Shadow-Signature</code> header on incoming requests.
        </p>
        <div className="bg-slate-800 border border-surface-border rounded-lg px-3 py-2.5 font-mono text-xs text-yellow-300 break-all select-all mb-4">
          {created.secret}
        </div>
        <button onClick={onClose} className="w-full py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">Done</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-surface-border rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h3 className="font-semibold text-white">Add Webhook</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {err && <div className="text-red-400 text-xs bg-red-900/20 border border-red-700/30 px-3 py-2 rounded">{err}</div>}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {SIEM_PRESETS.map((p, i) => (
                <button key={i} onClick={() => { setPreset(i); setForm(f => ({ ...f, url: p.url, name: p.label !== 'Custom endpoint' ? p.label : f.name })); }}
                  className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${preset === i ? 'bg-brand-600 border-brand-500 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {SIEM_PRESETS[preset]?.hint && <p className="text-[10px] text-slate-600 mt-1">{SIEM_PRESETS[preset].hint}</p>}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Splunk SIEM"
              className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Endpoint URL</label>
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..."
              className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">Events to send</label>
            <div className="space-y-2">
              {allEvents.map(ev => (
                <label key={ev} className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)} className="mt-0.5" />
                  <div>
                    <EventBadge event={ev} />
                    <span className="text-xs text-slate-500 ml-1">{EVENT_DESC[ev]}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-600 text-slate-400 rounded-lg text-sm">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Creating…' : 'Create webhook'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WebhookRow({ hook, allEvents, onRefresh }) {
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [flash, setFlash] = useState(null);

  async function handleTest() {
    setTesting(true);
    try {
      await testWebhook(hook.id);
      setFlash({ type: 'success', msg: 'Test ping delivered ✓' });
    } catch (e) {
      setFlash({ type: 'error', msg: e.response?.data?.message || 'Test failed' });
    } finally {
      setTesting(false);
      setTimeout(() => setFlash(null), 3000);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try { await updateWebhook(hook.id, { enabled: !hook.enabled }); onRefresh(); }
    catch { } finally { setToggling(false); }
  }

  async function handleDelete() {
    if (!confirm(`Delete webhook "${hook.name}"?`)) return;
    try { await deleteWebhook(hook.id); onRefresh(); } catch { }
  }

  return (
    <>
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 mb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white text-sm">{hook.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${hook.enabled ? 'text-green-400 bg-green-900/20 border-green-700/30' : 'text-slate-500 bg-slate-700/30 border-slate-600/30'}`}>
                {hook.enabled ? '● Active' : '○ Disabled'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">{hook.url}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={handleTest} disabled={testing}
              className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50">
              {testing ? '…' : '⚡ Test'}
            </button>
            <button onClick={() => setShowLog(true)}
              className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
              📋 Log
            </button>
            <button onClick={handleToggle} disabled={toggling}
              className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
              {hook.enabled ? 'Disable' : 'Enable'}
            </button>
            <button onClick={handleDelete}
              className="px-2.5 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          {hook.events?.map(ev => <EventBadge key={ev} event={ev} />)}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>📤 {hook.stats?.total ?? 0} deliveries</span>
          <span className="text-green-500">✓ {hook.stats?.success ?? 0}</span>
          {(hook.stats?.failed ?? 0) > 0 && <span className="text-red-400">✗ {hook.stats.failed}</span>}
          {hook.last_delivery && (
            <span>Last: <span className={hook.last_delivery.status === 'success' ? 'text-green-400' : 'text-red-400'}>{hook.last_delivery.status}</span> {new Date(hook.last_delivery.created_at).toLocaleDateString()}</span>
          )}
        </div>

        {flash && (
          <div className={`mt-2 text-xs px-2.5 py-1.5 rounded border ${flash.type === 'success' ? 'border-green-700/30 text-green-400' : 'border-red-700/30 text-red-400'}`}>
            {flash.msg}
          </div>
        )}
      </div>
      {showLog && <DeliveryLog webhookId={hook.id} onClose={() => setShowLog(false)} />}
    </>
  );
}

export default function Webhooks() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    if (!activeWorkspace) return;
    setLoading(true);
    listWebhooks(activeWorkspace.id)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [activeWorkspace]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-slate-400 text-sm mt-1">
            Push real-time events to Splunk, Datadog, PagerDuty, or any HTTPS endpoint. HMAC-signed payloads.
          </p>
        </div>
        {activeWorkspace && (
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            + Add webhook
          </button>
        )}
      </div>

      {!activeWorkspace && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5 text-amber-300 text-sm">
          Select a workspace to manage webhooks.
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-slate-500">Loading webhooks…</div>
      )}

      {data && !loading && (
        <>
          {/* Event reference */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Available Events</h2>
            <div className="grid grid-cols-2 gap-2">
              {(data.all_events || ALL_EVENTS).map(ev => (
                <div key={ev} className="flex items-center gap-2">
                  <EventBadge event={ev} />
                  <span className="text-[10px] text-slate-500">{EVENT_DESC[ev]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payload format */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Payload Format</h2>
            <pre className="text-[11px] font-mono text-slate-300 bg-slate-800/60 rounded-lg p-3 overflow-x-auto">{`POST https://your-endpoint.com/ingest
Content-Type: application/json
X-Shadow-Event: app.critical
X-Shadow-Delivery: <uuid>
X-Shadow-Signature: sha256=<hmac-sha256>

{
  "id": "delivery-uuid",
  "event": "app.critical",
  "workspace_id": "...",
  "workspace_name": "Acme Corp",
  "timestamp": "2026-09-18T14:00:00.000Z",
  "data": {
    "app_id": "AAA_ChatGPT",
    "app_name": "ChatGPT",
    "risk_level": "critical",
    "risk_score": 85,
    "developer": "OpenAI",
    "source": "google",
    "is_ai_tool": true,
    "scopes": ["https://www.googleapis.com/auth/gmail.readonly"]
  }
}`}</pre>
          </div>

          {/* Webhook list */}
          {data.webhooks?.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-5xl mb-4">🔗</div>
              <div className="text-slate-300 font-medium">No webhooks configured</div>
              <div className="text-sm mt-1">Add one to start streaming events to your SIEM or alerting tool.</div>
              <button onClick={() => setShowCreate(true)}
                className="mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium">
                Add your first webhook
              </button>
            </div>
          ) : (
            data.webhooks.map(h => (
              <WebhookRow key={h.id} hook={h} allEvents={data.all_events || ALL_EVENTS} onRefresh={load} />
            ))
          )}
        </>
      )}

      {showCreate && (
        <CreateModal
          workspaceId={activeWorkspace?.id}
          allEvents={data?.all_events || ALL_EVENTS}
          onCreated={load}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
