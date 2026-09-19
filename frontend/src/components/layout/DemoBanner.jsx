import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function DemoBanner() {
  const user = useAuthStore(s => s.user);
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.email !== 'demo@shadowit.app' || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs shrink-0">
      <div className="flex items-center gap-2 text-amber-300">
        <span className="text-base">👀</span>
        <span>
          <strong>Demo mode</strong> — You're exploring <strong>Acme Corp</strong> sample data with 16 fake apps.
          Nothing here is real or saved.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link to="/register"
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1 rounded-lg transition-colors whitespace-nowrap">
          Sign up free →
        </Link>
        <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-300 text-base leading-none">✕</button>
      </div>
    </div>
  );
}
