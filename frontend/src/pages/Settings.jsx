import { useAuthStore } from '../store/authStore';

export default function Settings() {
  const user = useAuthStore(s => s.user);
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
