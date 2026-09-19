import { useState } from 'react';
import { Link } from 'react-router-dom';

const MONTHLY = {
  pro:      19,
  business: 49,
};
const ANNUAL = {
  pro:      15,   // $15/mo billed $180/yr  (vs $228 monthly)
  business: 39,   // $39/mo billed $468/yr  (vs $588 monthly)
};

const PLANS = (prices) => [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    period: '',
    badge: null,
    tagline: 'For individuals & small teams getting started',
    cta: 'Get started free',
    ctaTo: '/register',
    ctaStyle: 'border border-slate-600 text-slate-200 hover:border-slate-400',
    features: [
      '1 workspace',
      '1 integration (Slack or Google)',
      'Up to 50 apps discovered',
      '3 manual scans per month',
      'Risk scoring & app inventory',
      'Basic whitelist (10 apps)',
      '7-day scan history',
      'Community support',
    ],
    missing: [
      'Auto-scan scheduling',
      'AI tool detection',
      'Breach alerts',
      'Team members',
      'API keys & webhooks',
      'CSV / PDF export',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: prices.pro,
    period: '/mo',
    badge: 'Most Popular',
    tagline: 'For growing teams that need full visibility',
    cta: 'Start 14-day free trial',
    ctaTo: '/register',
    ctaStyle: 'bg-brand-600 hover:bg-brand-500 text-white',
    features: [
      '5 workspaces',
      'All 6 integrations (Slack, Google, Microsoft, Okta, GitHub, Jira)',
      'Unlimited app discovery',
      'Unlimited scans + auto-scheduling',
      'AI tool detection & flags',
      'Breach & CVE alert feed',
      'Risk Policy Rules engine',
      'CSV export',
      'Webhook integrations (SIEM/SOAR)',
      'API keys for external access',
      'Offboarding checklist generator',
      'Slack Bot digest',
      'Spend estimator',
      '90-day history',
      'Email support (48 h SLA)',
    ],
    missing: [
      'Team RBAC & roles',
      'Executive PDF compliance report',
      'Priority support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: prices.business,
    period: '/mo',
    badge: null,
    tagline: 'For security & compliance teams at scale',
    cta: 'Start 14-day free trial',
    ctaTo: '/register',
    ctaStyle: 'bg-indigo-500 hover:bg-indigo-400 text-white',
    features: [
      'Everything in Pro',
      'Unlimited workspaces',
      'Team RBAC (admin / analyst / viewer)',
      'Member invite & access management',
      'Executive PDF compliance report',
      'SOC 2 · ISO 27001 · GDPR · HIPAA mapping',
      'Analytics & risk trend dashboard',
      'Data sensitivity classification',
      'Vendor risk scoring',
      'Approval workflow',
      '1-year history',
      'Priority email support (12 h SLA)',
    ],
    missing: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: '',
    badge: null,
    tagline: 'Custom pricing for large organisations',
    cta: 'Contact sales',
    ctaTo: 'mailto:sales@shadowit.app',
    ctaExternal: true,
    ctaStyle: 'border border-slate-600 text-slate-200 hover:border-indigo-400 hover:text-white',
    features: [
      'Everything in Business',
      'SSO / SAML integration',
      'Custom integrations on request',
      'Dedicated customer success manager',
      'Quarterly compliance review calls',
      'Custom data retention policy',
      'On-prem or private-cloud option',
      'SLA with uptime guarantee',
      'Volume discounts',
      'Invoice / PO billing',
    ],
    missing: [],
  },
];

const COMPARE_ROWS = [
  { label: 'Workspaces',              free: '1',          pro: '5',           business: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Integrations',            free: '1',          pro: 'All 6',       business: 'All 6',     enterprise: 'All + custom' },
  { label: 'Apps discovered',         free: '50 max',     pro: 'Unlimited',   business: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Scans / month',           free: '3',          pro: 'Unlimited',   business: 'Unlimited', enterprise: 'Unlimited' },
  { label: 'Auto-scan scheduling',    free: false,        pro: true,          business: true,        enterprise: true },
  { label: 'AI tool detection',       free: false,        pro: true,          business: true,        enterprise: true },
  { label: 'Breach & CVE alerts',     free: false,        pro: true,          business: true,        enterprise: true },
  { label: 'Risk Policy Rules',       free: false,        pro: true,          business: true,        enterprise: true },
  { label: 'CSV export',              free: false,        pro: true,          business: true,        enterprise: true },
  { label: 'Webhooks & API keys',     free: false,        pro: true,          business: true,        enterprise: true },
  { label: 'Team RBAC',               free: false,        pro: false,         business: true,        enterprise: true },
  { label: 'Executive PDF report',    free: false,        pro: false,         business: true,        enterprise: true },
  { label: 'SOC 2 / ISO 27001 / GDPR mapping', free: false, pro: false,      business: true,        enterprise: true },
  { label: 'SSO / SAML',             free: false,        pro: false,         business: false,       enterprise: true },
  { label: 'Dedicated CSM',          free: false,        pro: false,         business: false,       enterprise: true },
  { label: 'History retention',       free: '7 days',     pro: '90 days',     business: '1 year',    enterprise: 'Custom' },
  { label: 'Support',                 free: 'Community',  pro: 'Email 48 h',  business: 'Email 12 h', enterprise: 'Dedicated' },
];

const FAQS = [
  {
    q: 'Is there really a free plan?',
    a: 'Yes — the Starter plan is free forever, no credit card required. It scans up to 50 apps from one integration (Slack or Google) and gives you a full risk view to get started.',
  },
  {
    q: 'How does the 14-day trial work?',
    a: 'When you upgrade to Pro or Business your trial starts immediately — full access, no feature restrictions. If you don\'t love it, cancel before day 14 and you won\'t be charged a cent.',
  },
  {
    q: 'What integrations are included?',
    a: 'Slack, Google Workspace, Microsoft 365 / Azure AD, Okta, GitHub Org, and Jira/Atlassian. Enterprise customers can request additional integrations on a custom basis.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual plans are billed as a single upfront payment. Pro is $180/year (saving $48 vs monthly) and Business is $468/year (saving $120 vs monthly). You get 2 months free.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Absolutely. Upgrade or downgrade at any time from your settings. Upgrades take effect immediately; downgrades take effect at the end of your current billing period.',
  },
  {
    q: 'Do you offer discounts for non-profits or startups?',
    a: 'Yes — we offer 50% off for verified non-profits and early-stage startups (under $1 M ARR). Email us at billing@shadowit.app with proof of status.',
  },
  {
    q: 'Where is data stored?',
    a: 'All data is stored on Railway-managed PostgreSQL in the EU-West region by default. Enterprise plans can request a specific region or private-cloud deployment.',
  },
];

function Check({ ok, text }) {
  if (ok === true)   return <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5 shrink-0">✓</span><span className="text-slate-300 text-sm">{text}</span></li>;
  if (ok === false)  return <li className="flex items-start gap-2"><span className="text-slate-700 mt-0.5 shrink-0">✕</span><span className="text-slate-600 text-sm line-through">{text}</span></li>;
  return <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5 shrink-0">✓</span><span className="text-slate-300 text-sm">{text}</span></li>;
}

function Cell({ val }) {
  if (val === true)  return <td className="px-4 py-3 text-center text-green-400 text-lg">✓</td>;
  if (val === false) return <td className="px-4 py-3 text-center text-slate-700 text-lg">—</td>;
  return <td className="px-4 py-3 text-center text-slate-300 text-sm">{val}</td>;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const prices = annual ? ANNUAL : MONTHLY;
  const plans = PLANS(prices);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <span>🛡️</span> Shadow IT
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-wider">
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
          Start free. Scale when ready.
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          Shadow IT Scanner is 60–80% cheaper than legacy CASB tools like Zluri, BetterCloud, or Torii — with no per-seat pricing surprises.
        </p>

        {/* Annual toggle */}
        <div className="inline-flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2">
          <button
            onClick={() => setAnnual(false)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${!annual ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${annual ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Annual
          </button>
          {annual && (
            <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
              2 months free
            </span>
          )}
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-slate-800/40 border rounded-2xl p-6 flex flex-col ${
                plan.id === 'pro' ? 'border-brand-500 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'border-slate-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="text-white font-bold text-lg mb-1">{plan.name}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{plan.tagline}</div>
              </div>

              <div className="mb-6">
                {plan.price === null ? (
                  <div className="text-white font-extrabold text-3xl">Custom</div>
                ) : plan.price === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-extrabold text-3xl">$0</span>
                    <span className="text-slate-500 text-sm">/ forever</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-white font-extrabold text-3xl">${plan.price}</span>
                      <span className="text-slate-400 text-sm">{plan.period}</span>
                    </div>
                    {annual && (
                      <div className="text-slate-500 text-xs mt-0.5">
                        billed ${plan.price * 12}/yr
                        <span className="text-green-400 ml-1.5">
                          save ${(MONTHLY[plan.id] - plan.price) * 12}/yr
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {plan.ctaExternal ? (
                <a
                  href={plan.ctaTo}
                  className={`block text-center py-2.5 rounded-lg text-sm font-semibold mb-6 transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  to={plan.ctaTo}
                  className={`block text-center py-2.5 rounded-lg text-sm font-semibold mb-6 transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              )}

              <ul className="space-y-2.5 flex-1">
                {plan.features.map(f => <Check key={f} ok={true} text={f} />)}
                {plan.missing.map(f => <Check key={f} ok={false} text={f} />)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Competitor comparison callout */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-white font-bold text-xl mb-6 text-center">How we compare</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 pr-4 text-slate-400 font-semibold">Tool</th>
                  <th className="text-left py-2 pr-4 text-slate-400 font-semibold">Typical price</th>
                  <th className="text-left py-2 pr-4 text-slate-400 font-semibold">Model</th>
                  <th className="text-left py-2 text-slate-400 font-semibold">Free tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  { tool: '🛡️ Shadow IT Scanner', price: '$0–$49/mo', model: 'Flat rate', free: '✓ Yes' },
                  { tool: 'Zluri',         price: '$4–8/user/mo', model: 'Per seat', free: '✗ No' },
                  { tool: 'BetterCloud',   price: '$3–8/user/mo', model: 'Per seat', free: '✗ No' },
                  { tool: 'Torii',         price: '$3–6/user/mo', model: 'Per seat', free: '✗ No' },
                  { tool: 'Nudge Security', price: '$4/user/mo',  model: 'Per seat', free: '✗ No' },
                  { tool: 'Zylo',          price: 'Custom / $15K+ yr', model: 'Enterprise', free: '✗ No' },
                ].map(r => (
                  <tr key={r.tool} className={r.tool.startsWith('🛡️') ? 'text-brand-400 font-semibold' : 'text-slate-300'}>
                    <td className="py-2.5 pr-4">{r.tool}</td>
                    <td className="py-2.5 pr-4">{r.price}</td>
                    <td className="py-2.5 pr-4">{r.model}</td>
                    <td className="py-2.5">{r.free}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs mt-4 text-center">
            Competitor prices based on publicly available information. Per-seat tools cost $160–320+/month for a 40-person team.
          </p>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-white font-bold text-2xl text-center mb-8">Full feature comparison</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-semibold w-[35%]">Feature</th>
                <th className="text-center px-4 py-3 text-slate-400 font-semibold">Starter</th>
                <th className="text-center px-4 py-3 text-brand-400 font-semibold">Pro</th>
                <th className="text-center px-4 py-3 text-indigo-400 font-semibold">Business</th>
                <th className="text-center px-4 py-3 text-slate-400 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {COMPARE_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-slate-900/40' : ''}>
                  <td className="px-4 py-3 text-slate-300">{row.label}</td>
                  <Cell val={row.free} />
                  <Cell val={row.pro} />
                  <Cell val={row.business} />
                  <Cell val={row.enterprise} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              quote: 'Found 34 apps we had no idea existed. The risk scores immediately told us where to focus. Pro plan paid for itself in the first week.',
              name: 'James R.',
              role: 'CISO · Series B SaaS',
            },
            {
              quote: 'We were spending $400/month on Zluri. Switched to the Business plan — same coverage, better offboarding workflow, a fifth of the cost.',
              name: 'Priya S.',
              role: 'Head of IT · 120-person startup',
            },
            {
              quote: "The compliance PDF report was exactly what our auditors needed for SOC 2. Saved us hours of manual evidence gathering.",
              name: 'Michael T.',
              role: 'VP Engineering · FinTech',
            },
          ].map(t => (
            <div key={t.name} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
              <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <div className="text-white text-sm font-semibold">{t.name}</div>
                <div className="text-slate-500 text-xs">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-white font-bold text-2xl text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-white font-medium text-sm">{faq.q}</span>
                <span className={`text-slate-400 text-lg transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-slate-700/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-slate-800 py-16 text-center px-6">
        <h2 className="text-white font-bold text-3xl mb-3">Start your free scan today</h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          No credit card required. See every shadow app in your workspace in under 5 minutes.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register"
            className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-colors">
            Get started free →
          </Link>
          <a href="mailto:sales@shadowit.app"
            className="border border-slate-600 text-slate-300 hover:border-slate-400 px-8 py-3 rounded-xl font-semibold text-sm transition-colors">
            Talk to sales
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        Shadow IT Scanner · <Link to="/pricing" className="hover:text-slate-300">Pricing</Link> ·{' '}
        <a href="https://github.com/shadow-it/shadow-audit" className="hover:text-slate-300">GitHub</a>
      </footer>
    </div>
  );
}
