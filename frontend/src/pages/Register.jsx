import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await registerApi(form.name, form.email, form.password);
      setAuth(res.data.user, res.data.token);
      navigate('/connect');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🛡️</span>
          <h1 className="text-2xl font-bold text-white mt-3">Start your free audit</h1>
          <p className="text-slate-400 text-sm mt-1">No credit card required</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
          {[['name','Name','John Smith'],['email','Work email','you@company.com'],['password','Password','']].map(([k, label, ph]) => (
            <div key={k}>
              <label className="block text-sm text-slate-400 mb-1">{label}</label>
              <input type={k === 'password' ? 'password' : 'text'} value={form[k]} onChange={e => set(k, e.target.value)} required
                placeholder={ph}
                className="w-full bg-slate-800 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account? <Link to="/login" className="text-brand-500 hover:text-brand-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
