import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/navigation/Header';
import { Navbar } from '../components/navigation/Navbar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-4 px-6 text-center text-xs text-slate-500 no-print transition-colors duration-200">
        BookBrain Pvt Ltd &copy; {new Date().getFullYear()} — Advanced WIP Inventory & Manufacturing Control System
      </footer>
    </div>
  );
};
