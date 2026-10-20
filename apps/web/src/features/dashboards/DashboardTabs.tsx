import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Layers, GitCompare, PackageCheck } from 'lucide-react';

export const DashboardTabs: React.FC = () => {
  const tabs = [
    { to: '/dashboards', label: 'Home Overview', icon: Home, exact: true },
    { to: '/dashboards/raw-materials', label: 'Raw Material Details', icon: Layers },
    { to: '/dashboards/wip-progress', label: 'WIP In & Out Progress', icon: GitCompare },
    { to: '/dashboards/finished-goods', label: 'Finish Goods', icon: PackageCheck },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm dark:shadow-md flex items-center gap-1 overflow-x-auto no-print transition-colors duration-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.exact}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`
            }
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
