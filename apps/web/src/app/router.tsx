import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Features
import { LoginPage } from '../features/auth/LoginPage';
import { HomePage } from '../features/home/HomePage';
import { PurchaseEntryPage } from '../features/purchases/PurchaseEntryPage';
import { WipInPage } from '../features/wip-in/WipInPage';
import { FinishedGoodsPage } from '../features/finished-goods/FinishedGoodsPage';
import { WipOutPage } from '../features/wip-out/WipOutPage';
import { HomeOverviewDashboard } from '../features/dashboards/HomeOverviewDashboard';
import { RawMaterialDashboard } from '../features/dashboards/RawMaterialDashboard';
import { WipProgressDashboard } from '../features/dashboards/WipProgressDashboard';
import { FinishedGoodsDashboard } from '../features/dashboards/FinishedGoodsDashboard';
import { ReportCentrePage } from '../features/reports/ReportCentrePage';
import { EditRecordsPage } from '../features/records/EditRecordsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="purchases" element={<PurchaseEntryPage />} />
        <Route path="wip-in" element={<WipInPage />} />
        <Route path="finished-goods" element={<FinishedGoodsPage />} />
        <Route path="wip-out" element={<WipOutPage />} />

        {/* 4 Power BI Dashboards */}
        <Route path="dashboards" element={<HomeOverviewDashboard />} />
        <Route path="dashboards/home-overview" element={<HomeOverviewDashboard />} />
        <Route path="dashboards/raw-materials" element={<RawMaterialDashboard />} />
        <Route path="dashboards/wip-progress" element={<WipProgressDashboard />} />
        <Route path="dashboards/finished-goods" element={<FinishedGoodsDashboard />} />

        {/* 8 Reports */}
        <Route path="reports" element={<ReportCentrePage />} />

        {/* Data Corrections & Edit Center */}
        <Route path="edit-records" element={<EditRecordsPage />} />
        <Route path="migration" element={<Navigate to="/edit-records" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
