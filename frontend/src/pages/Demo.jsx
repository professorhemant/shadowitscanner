import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoLogin } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Demo() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setWorkspaces, setActiveWorkspace } = useWorkspaceStore();
  const [error, setError] = useState('');

  useEffect(() => {
    demoLogin()
      .then(res => {
        const { token, user, workspace_id } = res.data;
        setAuth(user, token);
        const demoWs = { id: workspace_id, name: 'Acme Corp (Demo)', type: 'google', last_scan_at: new Date().toISOString() };
        setWorkspaces([demoWs]);
        setActiveWorkspace(demoWs);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => setError('Failed to load demo. Please try again.'));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <a href="/" className="text-brand-400 hover:underline text-sm">← Back to home</a>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="text-5xl animate-pulse">🛡️</div>
          <div className="text-white font-semibold text-lg">Loading demo…</div>
          <div className="text-slate-400 text-sm">Setting up Acme Corp sample data</div>
          <div className="flex justify-center gap-1 mt-4">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
