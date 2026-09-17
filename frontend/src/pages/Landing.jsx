import { Link } from 'react-router-dom';

const features = [
  { icon: '🔍', title: 'Slack Scanner', desc: 'Enumerate every OAuth app, bot, and webhook connected to your Slack workspace.' },
  { icon: '📁', title: 'Google Workspace', desc: 'Audit all third-party apps with token access across your entire Google domain.' },
  { icon: '⚡', title: 'Risk Scoring', desc: 'Every app gets a 0–100 risk score based on OAuth scopes, verification status, and access breadth.' },
  { icon: '🔔', title: 'Alerts', desc: 'Get email alerts when new high-risk apps appear after each scheduled scan.' },
  { icon: '✅', title: 'Whitelist', desc: 'Mark approved apps so your team can focus on genuine threats.' },
  { icon: '📊', title: 'Trend Reports', desc: 'Track your shadow IT surface over time with historical scan comparisons.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <span>🛡️</span> Shadow IT
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-brand-600/10 border border-brand-600/20 text-brand-500 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
          Open-source CLI + SaaS Dashboard
        </div>
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
          Find every shadow app <br />hiding in your workspace
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Audit all third-party OAuth apps connected to Slack and Google Workspace. Get risk scores, alerts, and a whitelist — in minutes.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            Start free scan →
          </Link>
          <a href="https://github.com/shadow-it/shadow-audit" target="_blank" rel="noreferrer"
            className="border border-slate-600 text-slate-300 hover:border-slate-400 px-6 py-3 rounded-xl font-semibold transition-colors">
            View on GitHub
          </a>
        </div>

        {/* CLI install block */}
        <div className="mt-12 bg-slate-900 rounded-xl p-5 text-left border border-slate-700 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-500 text-xs ml-2">terminal</span>
          </div>
          <pre className="text-sm font-mono text-slate-300 space-y-1">
            <div><span className="text-slate-500">$</span> <span className="text-green-400">npx</span> shadow-audit scan --slack --slack-token xoxp-...</div>
            <div className="text-slate-400 pl-2">✔ Slack scan complete — 47 apps found</div>
            <div className="text-slate-400 pl-2"><span className="text-red-400">■ CRITICAL</span> 3 &nbsp; <span className="text-orange-400">■ HIGH</span> 9 &nbsp; <span className="text-blue-400">■ MEDIUM</span> 14 &nbsp; <span className="text-green-400">■ LOW</span> 21</div>
            <div><span className="text-slate-500">$</span> shadow-audit scan --slack --upload</div>
            <div className="text-slate-400 pl-2">✔ Uploaded! View at: https://shadowit.app/scans/abc123</div>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Everything you need to control shadow IT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-white mb-1">{f.title}</div>
              <div className="text-sm text-slate-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        Shadow IT Dashboard · Open-source CLI · <a href="https://github.com/shadow-it/shadow-audit" className="hover:text-slate-300">GitHub</a>
      </footer>
    </div>
  );
}
