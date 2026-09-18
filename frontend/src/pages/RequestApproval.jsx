import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceInfo, submitApproval } from '../api/approvals';

export default function RequestApproval() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [wsError, setWsError] = useState('');
  const [form, setForm] = useState({
    requester_name: '',
    requester_email: '',
    app_name: '',
    app_url: '',
    app_description: '',
    business_justification: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getWorkspaceInfo(workspaceId)
      .then(r => setWorkspace(r.data.workspace))
      .catch(() => setWsError('Invalid or expired request link.'));
  }, [workspaceId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitApproval({ workspace_id: workspaceId, ...form });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-3xl">🛡️</span>
            <span className="text-white font-bold text-xl">Shadow IT Scanner</span>
          </div>
          {workspace && (
            <p className="text-slate-400 text-sm">App approval request for <strong className="text-slate-200">{workspace.name}</strong></p>
          )}
        </div>

        {wsError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl text-center">{wsError}</div>
        ) : submitted ? (
          <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-white font-bold text-lg mb-2">Request submitted!</h2>
            <p className="text-slate-400 text-sm">Your request for <strong className="text-slate-200">{form.app_name}</strong> has been submitted to the IT team. You'll receive an email notification once it's been reviewed.</p>
          </div>
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-xl p-6">
            <h1 className="text-white font-bold text-lg mb-1">Request App Approval</h1>
            <p className="text-slate-400 text-sm mb-6">Fill in the form below and IT will review your request.</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Your name <span className="text-red-400">*</span></label>
                  <input type="text" required value={form.requester_name} onChange={e => set('requester_name', e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Work email <span className="text-red-400">*</span></label>
                  <input type="email" required value={form.requester_email} onChange={e => set('requester_email', e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">App / tool name <span className="text-red-400">*</span></label>
                <input type="text" required value={form.app_name} onChange={e => set('app_name', e.target.value)}
                  placeholder="e.g. Notion, ChatGPT, Figma"
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Website / URL <span className="text-slate-600">(optional)</span></label>
                <input type="url" value={form.app_url} onChange={e => set('app_url', e.target.value)}
                  placeholder="https://notion.so"
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">What does it do? <span className="text-slate-600">(optional)</span></label>
                <input type="text" value={form.app_description} onChange={e => set('app_description', e.target.value)}
                  placeholder="Short description of the tool"
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Business justification <span className="text-slate-600">(optional but recommended)</span></label>
                <textarea rows={3} value={form.business_justification} onChange={e => set('business_justification', e.target.value)}
                  placeholder="Why do you need this tool? How will you use it for work?"
                  className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 resize-none" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 mt-2">
                {submitting ? 'Submitting…' : 'Submit for IT approval →'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">Powered by Shadow IT Scanner</p>
      </div>
    </div>
  );
}
