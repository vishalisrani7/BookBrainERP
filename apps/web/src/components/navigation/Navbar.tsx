import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Boxes,
  PackageCheck,
  Truck,
  BarChart3,
  Printer,
  FileEdit,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/purchases', label: 'Purchase Raw Material', icon: ShoppingCart },
    { to: '/wip-in', label: 'WIP Stock IN', icon: Boxes },
    { to: '/finished-goods', label: 'Finish Good Entry', icon: PackageCheck },
    { to: '/wip-out', label: 'WIP Stock OUT', icon: Truck },
    { to: '/dashboards', label: 'Production Analytics', icon: BarChart3 },
    { to: '/reports', label: 'Print Report', icon: Printer },
    { to: '/edit-records', label: 'Data Correction & Edit', icon: FileEdit },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 shadow-sm no-print sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
