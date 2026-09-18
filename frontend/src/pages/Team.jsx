import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listWorkspaces } from '../api/workspaces';
import { listMembers, inviteMember, revokeMember, listInvites, acceptInvite } from '../api/team';
import { useAuthStore } from '../store/authStore';

const ROLE_BADGE = {
  owner:  'bg-brand-900/30 text-brand-300 border-brand-700/30',
  admin:  'bg-violet-900/30 text-violet-300 border-violet-700/30',
  viewer: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
};

const STATUS_BADGE = {
  active:  'bg-emerald-900/30 text-emerald-400 border-emerald-700/30',
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/30',
  revoked: 'bg-red-900/30 text-red-400 border-red-700/30',
};

function Badge({ cls, label }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{label}</span>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { dateStyle: 'medium' });
}

export default function Team() {
  const [searchParams] = useSearchParams();
  const currentUser = useAuthStore(s => s.user);

  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWs, setSelectedWs] = useState('');
  const [team, setTeam] = useState(null);
  const [invites, setInvites] = useState([]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState(null);

  // Handle ?token= in URL (from invite email link)
  const inviteToken = searchParams.get('token');
  const [autoAccepting, setAutoAccepting] = useState(!!inviteToken);

  useEffect(() => {
    if (!inviteToken) return;
    setAutoAccepting(true);
    acceptInvite(inviteToken)
      .then(r => flash(`Joined! ${r.data.message}`))
      .catch(e => flash(e.response?.data?.message || 'Could not accept invite', false))
      .finally(() => setAutoAccepting(false));
  }, [inviteToken]);

  useEffect(() => {
    listWorkspaces().then(r => {
      const ws = r.data.workspaces || [];
      setWorkspaces(ws);
      if (ws.length) setSelectedWs(ws[0].id);
    }).catch(() => {});
    listInvites().then(r => setInvites(r.data.invites || [])).catch(() => {});
  }, []);

  const loadTeam = useCallback((wsId) => {
    if (!wsId) return;
    listMembers(wsId).then(r => setTeam(r.data)).catch(() => setTeam(null));
  }, []);

  useEffect(() => { loadTeam(selectedWs); }, [selectedWs, loadTeam]);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 5000);
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember({ workspace_id: selectedWs, email: inviteEmail.trim(), role: inviteRole });
      flash(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      loadTeam(selectedWs);
    } catch (err) {
      flash(err.response?.data?.message || 'Invite failed', false);
    } finally { setInviting(false); }
  }

  async function handleRevoke(memberId, email) {
    if (!confirm(`Revoke access for ${email}?`)) return;
    try {
      await revokeMember(memberId);
      flash('Access revoked');
      loadTeam(selectedWs);
    } catch { flash('Revoke failed', false); }
  }

  async function handleAccept(inviteId) {
    const inv = invites.find(i => i.id === inviteId);
    if (!inv) return;
    // We need the token — we don't have it client-side (server stores it).
    // Use id-based accept as fallback: show a message to use invite URL instead.
    // Accept by looking up via pending invite for this user's email.
    flash('To accept: ask your admin for the invite link, or check your email.', false);
  }

  const ws = workspaces.find(w => w.id === selectedWs);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Management</h1>
        <p className="text-slate-400 text-sm mt-1">Invite colleagues to access your workspace and manage their roles.</p>
      </div>

      {autoAccepting && (
        <div className="px-4 py-3 bg-blue-900/30 border border-blue-700/30 rounded-lg text-sm text-blue-300">
          Accepting invitation…
        </div>
      )}

      {msg && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${msg.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30' : 'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
          {msg.text}
        </div>
      )}

      {/* Pending invites for current user */}
      {invites.length > 0 && (
        <div className="bg-surface-card border border-yellow-700/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
            <span className="text-yellow-400">📬</span>
            <h2 className="text-sm font-semibold text-white">Pending Invitations for You</h2>
          </div>
          <div className="divide-y divide-surface-border">
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-white">{inv.workspace_name}</div>
                  <div className="text-xs text-slate-400">
                    {inv.workspace_type} · Invited by {inv.invited_by} · {fmtDate(inv.invited_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge cls={ROLE_BADGE[inv.role]} label={inv.role} />
                  <span className="text-xs text-slate-500">Check email for accept link</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workspace selector */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Workspace</label>
        <select
          value={selectedWs}
          onChange={e => setSelectedWs(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          {workspaces.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
        </select>
      </div>

      {/* Current team */}
      {team && (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Team Members</h2>
            <span className="text-xs text-slate-500">{1 + (team.members?.length || 0)} member(s)</span>
          </div>
          <div className="divide-y divide-surface-border">
            {/* Owner row */}
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{team.owner.name}</span>
                  {team.owner.id === currentUser?.id && (
                    <span className="text-[10px] text-slate-500">(you)</span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{team.owner.email}</div>
              </div>
              <Badge cls={ROLE_BADGE.owner} label="owner" />
            </div>

            {team.members.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-white">{m.email}</div>
                  <div className="text-xs text-slate-400">
                    Invited {fmtDate(m.invited_at)}
                    {m.accepted_at && ` · Joined ${fmtDate(m.accepted_at)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge cls={STATUS_BADGE[m.status]} label={m.status} />
                  <Badge cls={ROLE_BADGE[m.role]} label={m.role} />
                  {m.status !== 'revoked' && (
                    <button
                      onClick={() => handleRevoke(m.id, m.email)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Invite Team Member</h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="viewer">Viewer — read-only access</option>
            <option value="admin">Admin — full access</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !selectedWs}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {inviting ? 'Sending…' : '+ Invite'}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3">
          An invite email is sent if SMTP is configured. Alternatively, share the generated invite link with your colleague.
        </p>
      </div>

      {/* Roles reference */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Role Permissions</h2>
        <div className="space-y-2 text-sm">
          {[
            { role: 'owner', desc: 'Full access — manage workspaces, team, billing, and all settings' },
            { role: 'admin', desc: 'Full access to workspace data — can invite/revoke members and run scans' },
            { role: 'viewer', desc: 'Read-only access — can view apps, reports, and risk data but cannot make changes' },
          ].map(r => (
            <div key={r.role} className="flex items-start gap-3">
              <Badge cls={ROLE_BADGE[r.role]} label={r.role} />
              <span className="text-slate-400 text-xs mt-0.5">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
