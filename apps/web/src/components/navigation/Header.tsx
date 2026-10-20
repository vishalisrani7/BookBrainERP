import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User, ShieldCheck, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 py-3 px-6 shadow-sm dark:shadow-md no-print transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* BookBrain Company Brand Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
            <span className="text-xl font-black tracking-wider text-white">BB</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              BookBrain Pvt Ltd
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-800 font-medium">
                WIP ERP
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plot No. 36, 37 Sector-C, Behind Padmini Resort, Hatundi Road, Badgaon, Ajmer 305001 &bull; Mob: 7014638667
            </p>
          </div>
        </div>

        {/* User Status, Theme Switcher & Logout */}
        <div className="flex items-center gap-3">
          {/* Segmented Theme Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-white text-amber-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Activate Light Mode"
            >
              <Sun size={14} className={theme === 'light' ? 'text-amber-500' : 'text-slate-400'} />
              <span>Light</span>
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-right">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <User size={16} />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{user.fullName || user.username}</div>
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end">
                    <ShieldCheck size={12} className="text-emerald-500 dark:text-emerald-400" />
                    {user.role}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-medium transition"
                title="Sign Out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
