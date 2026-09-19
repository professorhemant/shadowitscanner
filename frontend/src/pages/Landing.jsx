import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ─── data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '24+',    label: 'Risk signals per app' },
  { value: '6',      label: 'Native integrations' },
  { value: '25+',    label: 'Breach records tracked' },
  { value: '4',      label: 'Compliance frameworks' },
];

const PAIN_POINTS = [
  { icon: '🔓', title: 'Data breaches via forgotten OAuth',   desc: 'Ex-employees keep OAuth tokens active. One compromised third-party app can exfiltrate your entire Google Drive.' },
  { icon: '📋', title: 'Compliance gaps cost six figures',     desc: 'SOC 2, ISO 27001, and GDPR audits fail when you can\'t produce a complete inventory of data-accessing apps.' },
  { icon: '💸', title: 'SaaS sprawl inflates the budget',      desc: 'Teams spin up apps on personal cards. The average 200-person company wastes $35K/year on duplicate or abandoned tools.' },
  { icon: '🚪', title: 'Offboarding leaves doors open',        desc: 'IT revokes the SSO account but forgets 23 other OAuth connections. Each is a live credential waiting to be abused.' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect in 2 minutes',
    desc: 'Paste an OAuth token or API key for Slack, Google Workspace, Microsoft 365, Okta, GitHub, or Jira. No agent install, no firewall changes.',
    detail: ['Read-only permissions only', 'TLS encrypted in transit', 'Token stored encrypted at rest'],
  },
  {
    step: '02',
    title: 'Scan discovers everything',
    desc: 'The scanner enumerates every OAuth app, bot, webhook, and service account — including ones added years ago that nobody remembers.',
    detail: ['Deduplicates across sources', 'Risk-scores 0–100 instantly', 'Flags AI tools automatically'],
  },
  {
    step: '03',
    title: 'Act on what matters',
    desc: 'Set policy rules, approve trusted apps, send revocation checklists to IT, and download a compliance PDF for your next audit.',
    detail: ['Auto-scan on your schedule', 'Slack / email alerts', 'SOC 2 · ISO 27001 · GDPR ready'],
  },
];

const FEATURES = [
  {
    icon: '📊',
    title: 'App Inventory & Risk Scoring',
    desc: 'Every third-party app gets a 0–100 risk score based on OAuth scopes, admin access, AI classification, publisher verification, and user count. Sort, filter, and export in seconds.',
    tag: 'Core',
    tagColor: 'bg-blue-500/15 text-blue-400',
  },
  {
    icon: '🤖',
    title: 'AI Tool Detection',
    desc: 'Automatically flags ChatGPT, Copilot, Grammarly, Notion AI, and 30+ other AI tools. Shows data-training clauses, retention policies, and server geography for each.',
    tag: 'AI',
    tagColor: 'bg-purple-500/15 text-purple-400',
  },
  {
    icon: '📋',
    title: 'Custom Risk Policy Rules',
    desc: 'Write IF/THEN rules: "IF app has admin scope AND is unverified → escalate to CRITICAL." Policies apply instantly to your entire inventory — no re-scanning needed.',
    tag: 'Policies',
    tagColor: 'bg-orange-500/15 text-orange-400',
  },
  {
    icon: '🚨',
    title: 'Breach & CVE Alert Feed',
    desc: 'Cross-references your app inventory against 25+ real-world breach records (Okta, LastPass, CircleCI, Microsoft Storm-0558…). Know your exposure within seconds of running a scan.',
    tag: 'Security',
    tagColor: 'bg-red-500/15 text-red-400',
  },
  {
    icon: '🚪',
    title: 'Offboarding Checklist',
    desc: 'Enter a departing employee\'s email. Get a prioritised, printable revocation checklist for every app they accessed — with exact admin console steps per source.',
    tag: 'Compliance',
    tagColor: 'bg-green-500/15 text-green-400',
  },
  {
    icon: '📄',
    title: 'Executive PDF Report',
    desc: '6-page compliance PDF with cover, executive summary, critical-app tables, AI analysis, approved-app whitelist, and full SOC 2 / ISO 27001 / GDPR control mapping.',
    tag: 'Reporting',
    tagColor: 'bg-teal-500/15 text-teal-400',
  },
];

const INTEGRATIONS = [
  { name: 'Slack',           icon: '💬', color: 'text-yellow-400' },
  { name: 'Google Workspace',icon: '📁', color: 'text-blue-400' },
  { name: 'Microsoft 365',   icon: '🪟', color: 'text-blue-300' },
  { name: 'Okta',            icon: '🔐', color: 'text-blue-500' },
  { name: 'GitHub',          icon: '🐙', color: 'text-slate-300' },
  { name: 'Jira / Atlassian',icon: '📌', color: 'text-blue-400' },
];

const TESTIMONIALS = [
  { quote: 'Found 34 apps we had no idea existed. The risk scores immediately told us where to focus. Pro plan paid for itself in the first week.', name: 'James R.', role: 'CISO · Series B SaaS' },
  { quote: 'We were spending $400/month on Zluri. Switched here — same coverage, better offboarding workflow, a fifth of the cost.', name: 'Priya S.', role: 'Head of IT · 120-person startup' },
  { quote: 'The compliance PDF was exactly what our auditors needed for SOC 2. Saved us hours of manual evidence gathering.', name: 'Michael T.', role: 'VP Engineering · FinTech' },
];

const PRICING_PREVIEW = [
  { name: 'Starter', price: 'Free', desc: '1 workspace · 1 integration · 50 apps', highlight: false },
  { name: 'Pro',     price: '$19/mo', desc: 'All integrations · Unlimited apps · Breach alerts', highlight: true },
  { name: 'Business',price: '$49/mo', desc: 'Team RBAC · PDF reports · Priority support', highlight: false },
];

// ─── mini dashboard mockup (pure CSS, no images) ─────────────────────────────

const MOCK_APPS = [
  { name: 'GitHub Copilot',   score: 72, level: 'high',     ai: true  },
  { name: 'Notion',           score: 55, level: 'medium',   ai: true  },
  { name: 'DocuSign',         score: 48, level: 'medium',   ai: false },
  { name: 'Zapier',           score: 81, level: 'critical', ai: false },
  { name: 'Grammarly',        score: 61, level: 'high',     ai: true  },
];

const LEVEL_STYLE = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const SCORE_BAR = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-blue-500',
};

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-blue-600/10 rounded-2xl blur-2xl scale-110 pointer-events-none" />

      <div className="relative bg-[#0d1526] border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/60 border-b border-slate-700/50">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-slate-500">Shadow IT — App Inventory</span>
          <span className="ml-auto text-[10px] text-slate-600">16 apps · last scan 2h ago</span>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-4 gap-2 px-4 pt-4 pb-2">
          {[['3','critical','text-red-400'],['5','high','text-orange-400'],['6','medium','text-blue-400'],['2','low','text-green-400']].map(([n,l,c]) => (
            <div key={l} className="bg-slate-800/50 rounded-lg p-2.5 text-center border border-slate-700/40">
              <div className={`text-xl font-bold ${c}`}>{n}</div>
              <div className="text-[10px] text-slate-500 capitalize">{l}</div>
            </div>
          ))}
        </div>

        {/* App rows */}
        <div className="px-4 pb-4 space-y-1.5 mt-2">
          {MOCK_APPS.map(app => (
            <div key={app.name} className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-200 truncate">{app.name}</span>
                  {app.ai && <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">AI</span>}
                </div>
                <div className="mt-1 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${SCORE_BAR[app.level]}`} style={{ width: `${app.score}%` }} />
                </div>
              </div>
              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${LEVEL_STYLE[app.level]}`}>
                {app.score}
              </span>
            </div>
          ))}
          <div className="text-center text-[10px] text-slate-600 pt-1">+ 11 more apps</div>
        </div>
      </div>
    </div>
  );
}

// ─── nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-[#0a0f1e]/95 backdrop-blur border-b border-slate-800 shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <span>🛡️</span> Shadow IT
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features"  className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how"       className="text-sm text-slate-400 hover:text-white transition-colors">How it works</a>
            <Link to="/pricing"  className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
            <a href="https://github.com/professorhemant/shadowitscanner" target="_blank" rel="noreferrer"
               className="text-sm text-slate-400 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"    className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="bg-brand-600 hover:bg-brand-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            Start free →
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 overflow-x-hidden">
      <Nav />

      {/* ── HERO ── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
        {/* Background radial */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Now with AI tool detection & breach alerts
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.1] mb-6">
              Find every{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                shadow app
              </span>{' '}
              before it finds you
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Audit every OAuth app connected to Slack, Google, Microsoft, Okta, GitHub, and Jira.
              Risk-score, alert, and revoke — all from one dashboard.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/register"
                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-900/30">
                Start free scan →
              </Link>
              <Link to="/pricing"
                className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
                View pricing
              </Link>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <span className="text-green-400">✓</span> No credit card required
              <span className="mx-2">·</span>
              <span className="text-green-400">✓</span> Read-only permissions
              <span className="mx-2">·</span>
              <span className="text-green-400">✓</span> Results in &lt;5 min
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-block text-xs font-semibold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            The problem
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            The average company has{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              10× more apps
            </span>{' '}
            than IT knows about
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Employees connect tools without approval. OAuth tokens persist for years. Every unknown app is an open door.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PAIN_POINTS.map(p => (
            <div key={p.title} className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-6">
              <div className="text-3xl mb-3">{p.icon}</div>
              <div className="text-white font-semibold mb-2">{p.title}</div>
              <div className="text-slate-400 text-sm leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-slate-900/30 border-y border-slate-800 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-semibold text-brand-500 bg-brand-600/10 border border-brand-600/20 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              How it works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-slate-600 to-transparent z-0" />
                )}
                <div className="relative z-10 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 h-full">
                  <div className="text-4xl font-extrabold text-slate-700 mb-4 font-mono">{step.step}</div>
                  <div className="text-white font-semibold text-lg mb-2">{step.title}</div>
                  <div className="text-slate-400 text-sm leading-relaxed mb-4">{step.desc}</div>
                  <ul className="space-y-1.5">
                    {step.detail.map(d => (
                      <li key={d} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-brand-500">✓</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-block text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything you need to control shadow IT</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-600 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{f.icon}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.tagColor}`}>{f.tag}</span>
              </div>
              <div className="text-white font-semibold mb-2 group-hover:text-blue-300 transition-colors">{f.title}</div>
              <div className="text-slate-400 text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CLI TERMINAL ── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-800/80 border-b border-slate-700">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-slate-500 text-xs">terminal — shadow-audit CLI</span>
          </div>
          <div className="p-5 font-mono text-sm space-y-2">
            <div><span className="text-slate-500">$</span> <span className="text-green-400">npx</span> <span className="text-white">shadow-audit scan --slack --slack-token xoxp-...</span></div>
            <div className="text-slate-400 pl-4">⠿ Authenticating…  <span className="text-green-400">✔ connected</span></div>
            <div className="text-slate-400 pl-4">⠿ Enumerating OAuth apps…  <span className="text-green-400">✔ 47 apps found</span></div>
            <div className="text-slate-400 pl-4">⠿ Scoring risks…  <span className="text-green-400">✔ complete</span></div>
            <div className="pl-4 mt-1">
              <span className="text-red-400 font-bold">■ CRITICAL</span> <span className="text-slate-300">3</span>
              {'   '}<span className="text-orange-400 font-bold">■ HIGH</span> <span className="text-slate-300">9</span>
              {'   '}<span className="text-blue-400 font-bold">■ MEDIUM</span> <span className="text-slate-300">14</span>
              {'   '}<span className="text-green-400 font-bold">■ LOW</span> <span className="text-slate-300">21</span>
            </div>
            <div className="mt-1"><span className="text-slate-500">$</span> <span className="text-white">shadow-audit scan --slack --upload</span></div>
            <div className="text-slate-400 pl-4">✔ Uploaded! View at: <span className="text-brand-500">https://shadowit.app/scans/abc123</span></div>
          </div>
        </div>
        <p className="text-center text-slate-500 text-xs mt-4">
          Open-source CLI available via <code className="text-slate-400">npx shadow-audit</code> · Works offline or uploads to the dashboard
        </p>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="border-y border-slate-800 bg-slate-900/30 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm uppercase tracking-widest font-semibold mb-8">Connects with your entire stack</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {INTEGRATIONS.map(i => (
              <div key={i.name} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-slate-600 transition-colors">
                <span className={`text-2xl ${i.color}`}>{i.icon}</span>
                <span className="text-xs text-slate-400 text-center leading-tight">{i.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Trusted by security & IT teams</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-slate-800/30 border border-slate-700/60 rounded-2xl p-6 flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-4">"{t.quote}"</p>
              <div>
                <div className="text-white text-sm font-semibold">{t.name}</div>
                <div className="text-slate-500 text-xs">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="bg-slate-900/30 border-y border-slate-800 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Simple, transparent pricing</h2>
          <p className="text-slate-400 mb-10">
            60–80% cheaper than legacy CASB tools. No per-seat pricing surprises.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {PRICING_PREVIEW.map(p => (
              <div key={p.name}
                className={`rounded-2xl p-6 border ${p.highlight ? 'bg-brand-600/10 border-brand-500/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'bg-slate-800/30 border-slate-700/60'}`}>
                <div className={`font-bold text-lg mb-1 ${p.highlight ? 'text-brand-400' : 'text-white'}`}>{p.name}</div>
                <div className="text-3xl font-extrabold text-white mb-3">{p.price}</div>
                <div className="text-slate-400 text-sm">{p.desc}</div>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-semibold text-sm transition-colors">
            See full pricing & feature comparison →
          </Link>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative py-28 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Ready to see what's <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">hiding in your workspace?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Free forever on Starter. No credit card. Results in under 5 minutes.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register"
              className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-900/40">
              Start your free scan →
            </Link>
            <a href="mailto:sales@shadowit.app"
              className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors">
              Talk to sales
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 font-bold text-white mb-4">
              <span>🛡️</span> Shadow IT
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Automated shadow IT discovery and compliance reporting for modern security teams.
            </p>
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Product</div>
            <ul className="space-y-2">
              {[['Features','#features'],['How it works','#how'],['Pricing','/pricing'],['Changelog','#']].map(([l,h]) => (
                <li key={l}>{h.startsWith('/') ? <Link to={h} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{l}</Link> : <a href={h} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{l}</a>}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Use Cases</div>
            <ul className="space-y-2">
              {['SOC 2 Compliance','ISO 27001 Audit','GDPR Compliance','Offboarding Security'].map(l => (
                <li key={l}><span className="text-slate-500 text-sm">{l}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Company</div>
            <ul className="space-y-2">
              {[['GitHub','https://github.com/professorhemant/shadowitscanner'],['Sign up','/register'],['Sign in','/login']].map(([l,h]) => (
                <li key={l}>{h.startsWith('/') ? <Link to={h} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{l}</Link> : <a href={h} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{l}</a>}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 text-xs">
          <span>© {new Date().getFullYear()} Shadow IT Scanner. Open-source CLI · SaaS Dashboard.</span>
          <span>Built for security teams who ship fast.</span>
        </div>
      </footer>
    </div>
  );
}
