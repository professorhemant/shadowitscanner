import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { changePassword } from '../api/auth';

export default function Settings() {
  const user = useAuthStore(s => s.user);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setStatus({ type: 'error', msg: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await changePassword(form.current, form.next);
      setStatus({ type: 'success', msg: 'Password updated successfully' });
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-slate-500">Name</div><div className="text-slate-200 mt-0.5">{user?.name}</div></div>
          <div><div className="text-slate-500">Email</div><div className="text-slate-200 mt-0.5">{user?.email}</div></div>
          <div><div className="text-slate-500">Plan</div><div className="text-slate-200 mt-0.5 capitalize">{user?.plan}</div></div>
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl p-6 mt-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {status && (
            <div className={`text-sm px-3 py-2 rounded-lg border ${
              status.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>{status.msg}</div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Current password</label>
            <input type="password" required value={form.current}
              onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
              className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">New password</label>
            <input type="password" required minLength={8} value={form.next}
              onChange={e => setForm(f => ({ ...f, next: e.target.value }))}
              className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Confirm new password</label>
            <input type="password" required value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
          </div>
          <button type="submit" disabled={loading}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl p-6 mt-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">CLI API Key</h2>
        <p className="text-sm text-slate-400">Use this token with the open-source CLI to upload scan results to your dashboard.</p>
        <div className="bg-slate-800 rounded-lg px-4 py-3 font-mono text-xs text-slate-400 select-all">
          {user?.id ? `shadow-audit auth --token YOUR_API_KEY_HERE` : '…'}
        </div>
        <p className="text-xs text-slate-600">Generate an API key from your account profile (feature coming soon).</p>
      </div>
    </div>
  );
}
