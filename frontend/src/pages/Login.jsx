// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CheckSquare, Copy } from 'lucide-react';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-900">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-2">Sign in to TaskFlow</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" required className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-400">
            No account?{' '}
            <Link to="/register" className="font-medium text-brand-400 hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-brand-900/50 bg-brand-900/10 p-4">
            <h3 className="text-sm font-semibold text-brand-400 mb-3">Demo Access Credentials</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-lg border border-slate-700 shadow-sm">
                <div className="text-xs">
                  <span className="font-semibold text-slate-300 block mb-0.5">Admin</span>
                  <span className="text-slate-500">admin@demo.com / password123</span>
                </div>
                <button 
                  type="button"
                  onClick={() => copyToClipboard('admin@demo.com', 'Admin email')}
                  className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-900/30 rounded-md transition-colors"
                  title="Copy Admin Email"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-lg border border-slate-700 shadow-sm">
                <div className="text-xs">
                  <span className="font-semibold text-slate-300 block mb-0.5">Tasker</span>
                  <span className="text-slate-500">member@demo.com / password123</span>
                </div>
                <button 
                  type="button"
                  onClick={() => copyToClipboard('member@demo.com', 'Tasker email')}
                  className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-900/30 rounded-md transition-colors"
                  title="Copy Tasker Email"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
