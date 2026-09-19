import { useToastStore } from '../store/toastStore';
import { Link } from 'react-router-dom';

const STYLES = {
  demo:  'bg-amber-900/90 border-amber-500/50 text-amber-200',
  error: 'bg-red-900/90 border-red-500/50 text-red-200',
  info:  'bg-slate-800/90 border-slate-600/50 text-slate-200',
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur text-sm max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom-2 ${STYLES[t.type] || STYLES.info}`}>
          {t.type === 'demo' && <span className="shrink-0 text-base">👀</span>}
          {t.type === 'error' && <span className="shrink-0 text-base">⚠️</span>}
          <div className="flex-1 min-w-0">
            <span>{t.message}</span>
            {t.type === 'demo' && (
              <Link to="/register" className="ml-2 font-semibold underline hover:no-underline whitespace-nowrap">
                Sign up free →
              </Link>
            )}
          </div>
          <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
        </div>
      ))}
    </div>
  );
}
