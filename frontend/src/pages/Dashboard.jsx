import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard';
import { listWorkspaces } from '../api/workspaces';
import { triggerScan, getScanStatus } from '../api/scans';
import { seedDemo } from '../api/demo';
import { getBreaches } from '../api/breaches';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useToastStore } from '../store/toastStore';
import RiskSummaryCards from '../components/dashboard/RiskSummaryCards';
import RiskPieChart from '../components/dashboard/RiskPieChart';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import TopRiskyApps from '../components/dashboard/TopRiskyApps';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { activeWorkspace, setWorkspaces, setActiveWorkspace, workspaces } = useWorkspaceStore();
  const addToast = useToastStore(s => s.addToast);
  const qc = useQueryClient();
  const [activeScanId, setActiveScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // null | 'running' | 'completed' | 'failed'
  const pollRef = useRef(null);

  const { data: wsData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => listWorkspaces().then(r => { setWorkspaces(r.data.workspaces); return r.data.workspaces; }),
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', activeWorkspace?.id],
    queryFn: () => getDashboardStats(activeWorkspace?.id).then(r => r.data),
    enabled: true,
  });

  const { data: breachData } = useQuery({
    queryKey: ['breaches', activeWorkspace?.id],
    queryFn: () => getBreaches(activeWorkspace.id).then(r => r.data),
    enabled: !!activeWorkspace?.id,
    staleTime: 300_000,
  });

  // Poll active scan status
  useEffect(() => {
    if (!activeScanId) return;
    setScanStatus('running');
    pollRef.current = setInterval(async () => {
      try {
        const res = await getScanStatus(activeScanId);
        const run = res.data.run;
        if (run.status === 'completed') {
          clearInterval(pollRef.current);
          setActiveScanId(null);
          setScanStatus('completed');
          qc.invalidateQueries(['dashboard']);
          addToast(`Scan complete — ${run.apps_found} apps found (${run.critical_count} critical, ${run.high_count} high)`, 'success');
          setTimeout(() => setScanStatus(null), 5000);
        } else if (run.status === 'failed') {
          clearInterval(pollRef.current);
          setActiveScanId(null);
          setScanStatus('failed');
          addToast(`Scan failed: ${run.error_message || 'Unknown error'}`, 'error');
          setTimeout(() => setScanStatus(null), 6000);
        }
      } catch { clearInterval(pollRef.current); setActiveScanId(null); setScanStatus(null); }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeScanId]);

  const scan = useMutation({
    mutationFn: () => triggerScan(activeWorkspace?.id),
    onSuccess: (res) => {
      setActiveScanId(res.data.scan_run_id);
      addToast('Scan started — results will appear in a few seconds', 'info');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to start scan';
      addToast(msg, 'error');
    },
  });

  const demo = useMutation({
    mutationFn: seedDemo,
    onSuccess: () => {
      qc.invalidateQueries(['workspaces']);
      qc.invalidateQueries(['dashboard']);
    },
  });

  if (!wsData?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <span className="text-5xl">🛡️</span>
        <p className="text-lg font-semibold text-slate-200">No workspace connected</p>
        <p className="text-sm">Connect Slack or Google Workspace to start scanning.</p>
        <Link to="/connect" className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-500 transition-colors">
          Connect workspace →
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-px w-16 bg-surface-border"></div>
          <span className="text-xs text-slate-600">or</span>
          <div className="h-px w-16 bg-surface-border"></div>
        </div>
        <button
          onClick={() => demo.mutate()}
          disabled={demo.isPending}
          className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {demo.isPending ? 'Loading…' : '🤖 Try with demo data'}
        </button>
        {demo.isSuccess && <p className="text-xs text-green-400">Demo data loaded! Refresh the page.</p>}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Shadow IT risk overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={activeWorkspace?.id || ''}
            onChange={e => setActiveWorkspace(workspaces.find(w => w.id === e.target.value))}
            className="bg-surface-card border border-surface-border text-sm text-slate-300 px-3 py-2 rounded-lg focus:outline-none"
          >
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button
            onClick={() => demo.mutate()}
            disabled={demo.isPending}
            className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {demo.isPending ? 'Loading…' : '🤖 Demo data'}
          </button>
          <button
            onClick={() => scan.mutate()}
            disabled={!activeWorkspace || scan.isPending || scanStatus === 'running'}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {scanStatus === 'running' ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning…
              </>
            ) : '▶ Run Scan'}
          </button>
        </div>
      </div>

      {/* Scan status banner */}
      {scanStatus === 'running' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-600/10 border border-brand-500/30 rounded-xl text-sm">
          <span className="inline-block w-3.5 h-3.5 border-2 border-brand-400/40 border-t-brand-400 rounded-full animate-spin shrink-0" />
          <span className="text-brand-300">Scan in progress — this usually takes 10–30 seconds…</span>
        </div>
      )}
      {scanStatus === 'completed' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-300">
          <span>✓</span> Scan completed — dashboard updated below.
        </div>
      )}
      {scanStatus === 'failed' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
          <span>✕</span> Scan failed. Check that your workspace credentials are configured in{' '}
          <Link to="/connect" className="underline hover:text-red-200">Connect Workspace</Link>.
        </div>
      )}

      {/* Breach alert banner */}
      {breachData?.summary?.apps_with_breaches > 0 && (
        <Link to="/breaches" className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-700/40 rounded-xl hover:bg-red-900/30 transition-colors">
          <span className="text-lg">🚨</span>
          <div className="flex-1 min-w-0">
            <span className="text-red-300 font-semibold text-sm">
              {breachData.summary.apps_with_breaches} app{breachData.summary.apps_with_breaches !== 1 ? 's' : ''} in your workspace {breachData.summary.apps_with_breaches !== 1 ? 'have' : 'has'} known data breaches
            </span>
            {breachData.summary.critical_count > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-600/40">
                {breachData.summary.critical_count} CRITICAL
              </span>
            )}
          </div>
          <span className="text-red-400 text-sm shrink-0">View alerts →</span>
        </Link>
      )}

      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading stats…</div>
      ) : (
        <>
          <RiskSummaryCards counts={stats?.counts} total={stats?.total} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface-card rounded-xl p-5 border border-surface-border">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Risk Breakdown</h2>
              <RiskPieChart counts={stats?.counts} />
            </div>
            <div className="bg-surface-card rounded-xl p-5 border border-surface-border">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">30-Day Trend</h2>
              <TrendLineChart trend={stats?.trend} />
            </div>
          </div>

          <div className="bg-surface-card rounded-xl p-5 border border-surface-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Top Risky Apps</h2>
              <Link to="/apps" className="text-brand-500 hover:text-brand-400 text-xs">View all →</Link>
            </div>
            <TopRiskyApps apps={stats?.top_risky} />
          </div>
        </>
      )}
    </div>
  );
}
