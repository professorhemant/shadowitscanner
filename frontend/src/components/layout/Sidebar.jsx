import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/apps', label: 'App Inventory', icon: '⊞' },
  { to: '/scans', label: 'Scan History', icon: '↺' },
  { to: '/whitelist', label: 'Whitelist', icon: '✓' },
  { to: '/alerts', label: 'Alerts', icon: '🔔' },
  { to: '/nudges', label: 'Nudges', icon: '📣' },
  { to: '/approvals', label: 'Approvals', icon: '📋' },
  { to: '/spend', label: 'Spend Estimator', icon: '💰' },
  { to: '/offboarding', label: 'Offboarding', icon: '🚪' },
  { to: '/extension', label: 'Extension', icon: '🧩' },
  { to: '/sensitivity', label: 'Data Sensitivity', icon: '🔒' },
  { to: '/vendor-risk', label: 'Vendor Risk', icon: '🏢' },
  { to: '/breaches', label: 'Breach Alerts', icon: '🚨' },
  { to: '/reports', label: 'Reports', icon: '📄' },
  { to: '/connect', label: 'Connect Workspace', icon: '+' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const logout = useAuthStore(s => s.logout);
  return (
    <aside className="w-56 bg-surface-card border-r border-surface-border flex flex-col">
      <div className="px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span className="font-bold text-white text-lg">Shadow IT</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base w-4 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-surface-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <span>⏻</span> Sign out
        </button>
      </div>
    </aside>
  );
}
