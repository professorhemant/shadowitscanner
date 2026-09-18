import { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { downloadReport } from '../api/reports';

const FRAMEWORKS = [
  {
    name: 'SOC 2 Type II',
    icon: '🛡️',
    color: 'border-indigo-500',
    controls: ['CC6.1 Logical Access Controls', 'CC6.3 Remote Access', 'CC6.6 Logical Access Restrictions', 'CC9.2 Vendor Risk Management'],
  },
  {
    name: 'ISO 27001:2022',
    icon: '📋',
    color: 'border-blue-500',
    controls: ['A.5.23 Cloud Services', 'A.8.1 Asset Management', 'A.9.2 User Access Management', 'A.5.19 Supplier Relationships'],
  },
  {
    name: 'GDPR (EU 2016/679)',
    icon: '🇪🇺',
    color: 'border-orange-500',
    controls: ['Art. 30 Records of Processing', 'Art. 25 Data Protection by Design', 'Art. 28 Processor Obligations', 'Art. 44 Third-Country Transfers'],
  },
  {
    name: 'HIPAA',
    icon: '🏥',
    color: 'border-green-500',
    controls: ['§164.308 Admin Safeguards', '§164.312 Technical Safeguards', '§164.314 Org Requirements', 'Third-party access documentation'],
  },
];

export default function Reports() {
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    try {
      const res = await downloadReport(activeWorkspace.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `shadow-it-compliance-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Failed to generate report. Ensure at least one scan has been completed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate a comprehensive PDF covering discovered apps, risk levels, AI tools, and compliance framework mappings.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={loading || !activeWorkspace}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <span>⬇</span> Download PDF Report
            </>
          )}
        </button>
      </div>

      {!activeWorkspace && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg text-amber-300 text-sm">
          No workspace selected. Please select a workspace from the sidebar.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* What's included */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">Report Contents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '📄', title: 'Cover Page', desc: 'Organization name, scan date, risk summary tiles, AI tool highlight' },
            { icon: '📊', title: 'Executive Summary', desc: 'Key metrics, risk distribution table, recommended actions' },
            { icon: '⚠️', title: 'Critical & High Risk Apps', desc: 'Detailed table of top risky apps with scope, admin access, AI flags' },
            { icon: '🤖', title: 'AI Tool Analysis', desc: 'Data training clauses, retention policies, server geography, recommendations' },
            { icon: '✅', title: 'Approved Applications', desc: 'Full whitelist with approver name and date' },
            { icon: '🗂️', title: 'Compliance Framework Mapping', desc: 'SOC 2, ISO 27001, and GDPR control references for your audit evidence' },
          ].map(item => (
            <div key={item.title} className="flex gap-3 p-3 bg-slate-800/40 rounded-lg">
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="text-white text-sm font-medium">{item.title}</div>
                <div className="text-slate-400 text-xs mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Framework coverage */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Compliance Framework Coverage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FRAMEWORKS.map(fw => (
            <div key={fw.name} className={`border-l-4 ${fw.color} pl-4 py-2`}>
              <div className="flex items-center gap-2 mb-2">
                <span>{fw.icon}</span>
                <span className="text-white font-medium text-sm">{fw.name}</span>
              </div>
              <ul className="space-y-0.5">
                {fw.controls.map(c => (
                  <li key={c} className="text-slate-400 text-xs">• {c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-4">
          This report provides evidence artifacts to support your compliance audits. It does not constitute a certified audit or legal opinion.
        </p>
      </div>
    </div>
  );
}
