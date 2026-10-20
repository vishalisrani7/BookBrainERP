import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/api-client';
import { AuthResponse } from '@bookbrain/shared';
import { User, Lock, Eye, EyeOff, AlertCircle, ShieldAlert, Sun, Moon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      login(response.token, response.user);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setUsernameOrEmail('admin');
    setPassword('123');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 transition-colors duration-200">
      {/* Top Floating Theme Switcher */}
      <div className="w-full max-w-md flex justify-end mb-3">
        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Activate Dark Mode"
          >
            <Moon size={14} className={theme === 'dark' ? 'text-sky-400' : 'text-slate-400'} />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-slate-100 text-amber-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="Activate Light Mode"
          >
            <Sun size={14} className={theme === 'light' ? 'text-amber-500' : 'text-slate-400'} />
            <span>Light</span>
          </button>
        </div>
      </div>

      {/* Container inspired by PDF Page 2 Login Form */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 border-b border-sky-800/40 p-6 text-center relative text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20 text-xl border border-sky-400/30">
              AB
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-sky-300 bg-sky-950/80 px-2 py-1 rounded border border-sky-700">
                WIP ERP SYSTEM
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">BookBrain PVT LTD</h2>
          <p className="text-xs text-slate-200 mt-1">
            Plot No. 36,37 Sector-C, Behind Padmini Resort, Hatundi Road, Badgaon, Ajmer 305001
          </p>
          <p className="text-xs text-sky-300 font-medium mt-0.5">Mob.no. 7014638667</p>
        </div>

        {/* Login Form */}
        <div className="p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 text-sm transition transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          {/* Quick Login Helper */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <ShieldAlert size={14} className="text-sky-500" />
              <span>Super Admin Credentials: <strong className="font-mono text-slate-800 dark:text-slate-200">admin</strong> / <strong className="font-mono text-slate-800 dark:text-slate-200">123</strong></span>
            </div>
            <div className="flex items-center justify-center mt-2">
              <button
                type="button"
                onClick={handleFillAdmin}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-400 text-xs font-bold border border-sky-200 dark:border-slate-700 transition shadow-sm"
              >
                Auto-fill Super Admin (<span className="underline">admin</span> / 123)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
