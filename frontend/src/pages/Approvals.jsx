import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listApprovals, reviewApproval } from '../api/approvals';
import { useWorkspaceStore } from '../store/workspaceStore';

const STATUS_STYLES = {
  pending:  'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30',
  approved: 'bg-green-600/20 text-green-300 border border-green-500/30',
  rejected: 'bg-red-600/20 text-red-300 border border-red-500/30',
};

export default function Approvals() {
  const { activeWorkspace } = useWorkspaceStore();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { request, action }
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['approvals', activeWorkspace?.id, statusFilter],
    queryFn: () => listApprovals({ workspace_id: activeWorkspace?.id, status: statusFilter || undefined }).then(r => r.data),
    enabled: !!activeWorkspace?.id,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, review_reason }) => reviewApproval(id, { status, review_reason }),
    onSuccess: () => {
      qc.invalidateQueries(['approvals']);
      setReviewModal(null);
      setReason('');
    },
  });

  const requestUrl = activeWorkspace?.id
    ? `${window.location.origin}/request/${activeWorkspace.id}`
    : '';

  function openReview(request, action) {
    setReason('');
    setReviewModal({ request, action });
  }

  function handleReview() {
    mutation.mutate({ id: reviewModal.request.id, status: reviewModal.action, review_reason: reason });
  }

  const requests = data?.requests || [];
  const counts = data?.counts || { pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">App Approval Requests</h1>
        <p className="text-slate-400 text-sm mt-0.5">Review employee requests to use new tools</p>
      </div>

      {/* Shareable link */}
      {activeWorkspace && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-4">
          <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1.5">Employee Request Link</div>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-blue-200 text-xs bg-blue-900/30 px-3 py-1.5 rounded font-mono flex-1 min-w-0 truncate">{requestUrl}</code>
            <button
              onClick={() => navigator.clipboard.writeText(requestUrl)}
              className="shrink-0 text-xs px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 rounded-lg font-medium transition-colors"
            >
              Copy Link
            </button>
          </div>
          <p className="text-xs text-blue-400/70 mt-1.5">Share this link with employees so they can request tool approvals — no login needed.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: counts.pending, color: 'text-yellow-300', filter: 'pending' },
          { label: 'Approved', value: counts.approved, color: 'text-green-400', filter: 'approved' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-400', filter: 'rejected' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(f => f === s.filter ? '' : s.filter)}
            className={`bg-surface-card border rounded-xl p-4 text-left transition-colors ${statusFilter === s.filter ? 'border-brand-500' : 'border-surface-border hover:border-slate-500'}`}
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['Date', 'App', 'Requester', 'Business Reason', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="text-slate-400 font-medium">No requests yet</div>
                  <div className="text-slate-500 text-xs mt-1">Share the link above with employees to start receiving app requests.</div>
                </td>
              </tr>
            ) : requests.map(r => (
              <tr key={r.id} className="border-b border-surface-border/50 hover:bg-slate-700/10">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString()}<br/>
                  <span className="text-slate-600">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-200">{r.app_name}</div>
                  {r.app_url && <a href={r.app_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block max-w-[160px]">{r.app_url}</a>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-200 text-sm">{r.requester_name}</div>
                  <div className="text-slate-500 text-xs">{r.requester_email}</div>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px]">
                  <span className="line-clamp-2">{r.business_justification || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[r.status]}`}>
                    {r.status}
                  </span>
                  {r.review_reason && (
                    <div className="text-slate-500 text-xs mt-1 max-w-[120px] truncate" title={r.review_reason}>↳ {r.review_reason}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openReview(r, 'approved')}
                        className="text-xs px-2.5 py-1 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openReview(r, 'rejected')}
                        className="text-xs px-2.5 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-surface-card rounded-xl w-full max-w-md border border-surface-border shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white capitalize">
                {reviewModal.action === 'approved' ? '✅' : '❌'} {reviewModal.action} Request
              </h2>
              <button onClick={() => setReviewModal(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-800/60 border border-surface-border rounded-lg px-4 py-3">
                <div className="text-slate-200 font-medium">{reviewModal.request.app_name}</div>
                <div className="text-slate-500 text-xs mt-0.5">Requested by {reviewModal.request.requester_name} ({reviewModal.request.requester_email})</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Reason <span className="text-slate-600">(optional — sent to the requester)</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={reviewModal.action === 'approved' ? 'Approved for business use…' : 'Please use the approved alternative…'}
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-surface-border flex justify-end gap-3">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleReview}
                disabled={mutation.isPending}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium transition-colors disabled:opacity-40 ${reviewModal.action === 'approved' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
              >
                {mutation.isPending ? 'Saving…' : `Confirm ${reviewModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
