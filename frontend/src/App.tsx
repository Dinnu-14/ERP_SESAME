import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { RawMaterialPage } from './pages/RawMaterialPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { ProductionPage } from './pages/ProductionPage';
import { WastagePage } from './pages/WastagePage';
import { FranchisePage } from './pages/FranchisePage';
import { B2BPage } from './pages/B2BPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { SOPPage } from './pages/SOPPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-emerald-400">Verifying session credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="transfers" element={<WarehousesPage />} />
            <Route path="raw-materials" element={<RawMaterialPage />} />
            <Route path="procurement" element={<ProcurementPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="wastage" element={<WastagePage />} />
            <Route path="franchise" element={<FranchisePage />} />
            <Route path="b2b" element={<B2BPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="sops" element={<SOPPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
