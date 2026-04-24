import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import Sensors from './pages/Sensors';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import MaintenanceSchedules from './pages/MaintenanceSchedules';
import Alerts from './pages/Alerts';
import WorkOrders from './pages/WorkOrders';
import FailureAnalysis from './pages/FailureAnalysis';
import EquipmentHealth from './pages/EquipmentHealth';
import AnomalyDetection from './pages/AnomalyDetection';
import SpareParts from './pages/SpareParts';
import MaintenanceLogs from './pages/MaintenanceLogs';
import CostAnalysis from './pages/CostAnalysis';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import './App.css';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><LoadingSpinner /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main" style={{ marginLeft: 260 }}>
        <Navbar />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/predictive-analytics" element={<PredictiveAnalytics />} />
          <Route path="/maintenance-schedules" element={<MaintenanceSchedules />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/failure-analysis" element={<FailureAnalysis />} />
          <Route path="/equipment-health" element={<EquipmentHealth />} />
          <Route path="/anomaly-detection" element={<AnomalyDetection />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/maintenance-logs" element={<MaintenanceLogs />} />
          <Route path="/cost-analysis" element={<CostAnalysis />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={<UserManagement />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
