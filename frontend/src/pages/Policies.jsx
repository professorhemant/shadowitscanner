import { useState, useEffect, useCallback } from 'react';
import { listWorkspaces } from '../api/workspaces';
import { listPolicies, previewPolicies, createPolicy, updatePolicy, deletePolicy } from '../api/policies';

const CONDITION_TYPES = [
  { value: 'is_ai_tool',          label: 'Is an AI tool',                    hasValue: false },
  { value: 'has_admin_scope',     label: 'Has admin/super scope',             hasValue: false },
  { value: 'accesses_email',      label: 'Accesses email content',            hasValue: false },
  { value: 'accesses_drive',      label: 'Accesses files / Google Drive',     hasValue: false },
  { value: 'has_external_domain', label: 'Is from an external/unknown domain',hasValue: false },
  { value: 'app_name_contains',   label: 'App name contains…',                hasValue: true, placeholder: 'e.g. ChatGPT' },
  { value: 'developer_contains',  label: 'Developer contains…',               hasValue: true, placeholder: 'e.g. OpenAI' },
  { value: 'has_scope_containing',label: 'Has OAuth scope containing…',       hasValue: true, placeholder: 'e.g. gmail.readonly' },
  { value: 'source_equals',       label: 'Source is…',                        hasValue: true, placeholder: 'google / slack / microsoft' },
  { value: 'risk_score_gte',      label: 'Risk score ≥',                      hasValue: true, placeholder: 'e.g. 60' },
  { value: 'user_count_gte',      label: 'User count ≥',                      hasValue: true, placeholder: 'e.g. 20' },
];

const ACTION_TYPES = [
  { value: 'escalate_level', label: 'Escalate risk level to (only increases)' },
  { value: 'set_level',      label: 'Force risk level to' },
  { value: 'add_score',      label: 'Add to risk score (+points)' },
];

const LEVELS = ['low', 'medium', 'high', 'critical'];
const RISK_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' };

const PRESETS = [
  {
    name: 'AI tools → Critical',
    condition_type: 'is_ai_tool', condition_value: null,
    action_type: 'set_level', action_value: 'critical',
  },
  {
    name: 'Admin scope → High minimum',
    condition_type: 'has_admin_scope', condition_value: null,
    action_type: 'escalate_level', action_value: 'high',
  },
  {
    name: 'Email access → High minimum',
    condition_type: 'accesses_email', condition_value: null,
    action_type: 'escalate_level', action_value: 'high',
  },
  {
    name: 'Large user base (50+) → add 15 pts',
    condition_type: 'user_count_gte', condition_value: '50',
    action_type: 'add_score', action_value: '15',
  },
];

function ruleDescription(rule) {
  const cond = CONDITION_TYPES.find(c => c.value === rule.condition_type);
  const act  = ACTION_TYPES.find(a => a.value === rule.action_type);
  const condStr = cond?.hasValue ? `${cond.label} "${rule.condition_value}"` : cond?.label;
  const actStr  = rule.action_type === 'add_score' ? `add ${rule.action_value} to score` : `${act?.label} ${rule.action_value}`;
  return `IF ${condStr} → THEN ${actStr}`;
}

function LevelPill({ level }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium border capitalize"
      style={{ color: RISK_COLOR[level], borderColor: RISK_COLOR[level] + '44', background: RISK_COLOR[level] + '15' }}>
      {level}
    </span>
  );
}

export default function Policies() {
  const [workspaces, setWorkspaces]   = useState([]);
  const [selectedWs, setSelectedWs]   = useState('');
  const [rules, setRules]             = useState([]);
  const [preview, setPreview]         = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [msg, setMsg]                 = useState(null);

  const [form, setForm] = useState({
    name: '', condition_type: 'is_ai_tool', condition_value: '',
    action_type: 'escalate_level', action_value: 'high',
  });

  useEffect(() => {
    listWorkspaces().then(r => {
      const ws = r.data.workspaces || [];
      setWorkspaces(ws);
      if (ws.length) setSelectedWs(ws[0].id);
    }).catch(() => {});
  }, []);

  const load = useCallback((wsId) => {
    if (!wsId) return;
    listPolicies(wsId).then(r => setRules(r.data.rules || [])).catch(() => {});
    previewPolicies(wsId).then(r => setPreview(r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(selectedWs); }, [selectedWs, load]);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleCreate(data) {
    try {
      await createPolicy({ workspace_id: selectedWs, ...data });
      flash('Policy rule created');
      setShowAdd(false);
      setForm({ name: '', condition_type: 'is_ai_tool', condition_value: '', action_type: 'escalate_level', action_value: 'high' });
      load(selectedWs);
    } catch (err) { flash(err.response?.data?.message || 'Failed', false); }
  }

  async function handleToggle(rule) {
    try {
      await updatePolicy(rule.id, { enabled: !rule.enabled });
      load(selectedWs);
    } catch { flash('Update failed', false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this policy rule?')) return;
    try {
      await deletePolicy(id);
      flash('Rule deleted');
      load(selectedWs);
    } catch { flash('Delete failed', false); }
  }

  function applyPreset(preset) {
    setForm({ name: preset.name, condition_type: preset.condition_type, condition_value: preset.condition_value || '', action_type: preset.action_type, action_value: preset.action_value });
    setShowAdd(true);
  }

  const condMeta = CONDITION_TYPES.find(c => c.value === form.condition_type);
  const isScoreAction = form.action_type === 'add_score';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Policy Rules</h1>
          <p className="text-slate-400 text-sm mt-1">Define custom IF/THEN rules that override or escalate base risk scores for your workspace.</p>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Rule
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${msg.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
          {msg.text}
        </div>
      )}

      {/* Workspace selector */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <select
          value={selectedWs}
          onChange={e => setSelectedWs(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          {workspaces.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
        </select>
      </div>

      {/* Presets */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Quick Presets</h2>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)}
              className="text-left px-3 py-2.5 rounded-lg border border-slate-700 hover:border-brand-500 hover:bg-brand-900/10 transition-colors">
              <div className="text-sm font-medium text-white">{p.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{ruleDescription(p)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Add rule form */}
      {showAdd && (
        <div className="bg-surface-card border border-brand-500/40 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">New Policy Rule</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Rule Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. AI tools must be Critical"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Condition</label>
              <select
                value={form.condition_type}
                onChange={e => setForm(p => ({ ...p, condition_type: e.target.value, condition_value: '' }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
              >
                {CONDITION_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {condMeta?.hasValue && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Value</label>
                <input
                  value={form.condition_value}
                  onChange={e => setForm(p => ({ ...p, condition_value: e.target.value }))}
                  placeholder={condMeta.placeholder}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Action</label>
              <select
                value={form.action_type}
                onChange={e => setForm(p => ({ ...p, action_type: e.target.value, action_value: e.target.value === 'add_score' ? '10' : 'high' }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
              >
                {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                {isScoreAction ? 'Points to add' : 'Target level'}
              </label>
              {isScoreAction ? (
                <input
                  type="number" min="1" max="50"
                  value={form.action_value}
                  onChange={e => setForm(p => ({ ...p, action_value: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                />
              ) : (
                <select
                  value={form.action_value}
                  onChange={e => setForm(p => ({ ...p, action_value: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Preview sentence */}
          {form.name && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-slate-400">Preview: </span>
              <span className="text-white font-mono">{ruleDescription(form)}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button
              onClick={() => handleCreate(form)}
              disabled={!form.name}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              Create Rule
            </button>
          </div>
        </div>
      )}

      {/* Existing rules */}
      {rules.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Active Rules</h2>
            <span className="text-xs text-slate-500">{rules.filter(r => r.enabled).length} enabled / {rules.length} total</span>
          </div>
          <div className="divide-y divide-surface-border">
            {rules.map(rule => (
              <div key={rule.id} className={`flex items-center justify-between px-5 py-3 transition-opacity ${rule.enabled ? '' : 'opacity-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{rule.name}</span>
                    {!rule.enabled && <span className="text-[10px] text-slate-500 border border-slate-600 px-1.5 py-0.5 rounded">disabled</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">{ruleDescription(rule)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button onClick={() => handleToggle(rule)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${rule.enabled ? 'text-yellow-400 border-yellow-700/30 hover:bg-yellow-900/20' : 'text-emerald-400 border-emerald-700/30 hover:bg-emerald-900/20'}`}>
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rules.length === 0 && !showAdd && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-white font-medium">No policy rules yet</div>
          <div className="text-slate-400 text-sm mt-1">Use a preset or click "+ Add Rule" to create your first rule.</div>
        </div>
      )}

      {/* Impact preview */}
      {preview && preview.affected?.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-white">
              Current Impact — {preview.affected.length} app{preview.affected.length !== 1 ? 's' : ''} affected
              <span className="text-slate-400 font-normal ml-2">of {preview.total_apps} total</span>
            </h2>
          </div>
          <div className="divide-y divide-surface-border max-h-72 overflow-y-auto">
            {preview.affected.map(a => (
              <div key={a.app_id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <div>
                  <span className="text-white font-medium">{a.app_name}</span>
                  <span className="text-xs text-slate-500 ml-2">{a.policy_flags.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LevelPill level={a.original_level} />
                  <span className="text-slate-500">→</span>
                  <LevelPill level={a.new_level} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
