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
import AIHistory from './pages/AIHistory';
import WhatIfSimulator from './pages/WhatIfSimulator';
import SensorChart from './pages/SensorChart';
import CostForecast from './pages/CostForecast';
import PartsOptimizer from './pages/PartsOptimizer';
import MaintenanceWindowPlanner from './pages/MaintenanceWindowPlanner';
import AlertFatigueReduce from './pages/AlertFatigueReduce';
import WorkOrderPriority from './pages/WorkOrderPriority';
import MaintenanceRecommendation from './pages/MaintenanceRecommendation';
import FailureRootCause from './pages/FailureRootCause';
import MaintenanceROI from './pages/MaintenanceROI';
import OEEAnalyzer from './pages/OEEAnalyzer';
import PredictivePartsOrdering from './pages/PredictivePartsOrdering';
import CustomViewsPage from './pages/CustomViewsPage';
import LubricationRouteCompliance from './pages/LubricationRouteCompliance';
import './App.css';
import MissingFeaturesHub from './pages/MissingFeaturesHub';
import ProductionReadiness from './pages/ProductionReadiness';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAgenticMaintenanceOrchestrationPage from './pages/CFAgenticMaintenanceOrchestrationPage';
import CFDigitalTwinSimulationPage from './pages/CFDigitalTwinSimulationPage';
import CFAnomalyStreamingPage from './pages/CFAnomalyStreamingPage';
import CFPredictivePartsOrderingPage from './pages/CFPredictivePartsOrderingPage';
import CFMaintenanceRoiCalculatorPage from './pages/CFMaintenanceRoiCalculatorPage';
import GapAlertsWithoutAlertPage from './pages/GapAlertsWithoutAlertPage';
import GapWorkordersWithoutWorkorderPage from './pages/GapWorkordersWithoutWorkorderPage';
import GapNoDigitalPage from './pages/GapNoDigitalPage';
import GapCmmsIotOeeModulesExistButRealThirdPage from './pages/GapCmmsIotOeeModulesExistButRealThirdPage';
import GapNoIntegrationWithAssetManagementPurchaseDeprPage from './pages/GapNoIntegrationWithAssetManagementPurchaseDeprPage';
import GapNoMobileAppForFieldTechniciansGrep0ReactPage from './pages/GapNoMobileAppForFieldTechniciansGrep0ReactPage';
import GapNoWebhooksForExternalSystemsPage from './pages/GapNoWebhooksForExternalSystemsPage';
import GapLimitedNotificationsLayerPage from './pages/GapLimitedNotificationsLayerPage';
import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

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
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
          <Route path="/ai-history" element={<AIHistory />} />
          <Route path="/what-if-simulator" element={<WhatIfSimulator />} />
          <Route path="/sensor-chart" element={<SensorChart />} />
          <Route path="/cost-forecast" element={<CostForecast />} />
          <Route path="/parts-optimizer" element={<PartsOptimizer />} />
          <Route path="/maintenance-window-planner" element={<MaintenanceWindowPlanner />} />
          <Route path="/alert-fatigue-reduce" element={<AlertFatigueReduce />} />
          <Route path="/workorder-priority" element={<WorkOrderPriority />} />
          <Route path="/maintenance-recommendation" element={<MaintenanceRecommendation />} />
          <Route path="/failure-root-cause" element={<FailureRootCause />} />
          <Route path="/maintenance-roi" element={<MaintenanceROI />} />
          <Route path="/oee-analyzer" element={<OEEAnalyzer />} />
          <Route path="/predictive-parts-ordering" element={<PredictivePartsOrdering />} />
          <Route path="/custom-views" element={<CustomViewsPage />} />
          <Route path="/lubrication-route-compliance" element={<LubricationRouteCompliance />} />
        </Route>
      
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-maintenance-orchestration" element={<CFAgenticMaintenanceOrchestrationPage />} />
          <Route path="/cf-digital-twin-simulation" element={<CFDigitalTwinSimulationPage />} />
          <Route path="/cf-anomaly-streaming" element={<CFAnomalyStreamingPage />} />
          <Route path="/cf-predictive-parts-ordering" element={<CFPredictivePartsOrderingPage />} />
          <Route path="/cf-maintenance-roi-calculator" element={<CFMaintenanceRoiCalculatorPage />} />
          <Route path="/gap-alerts-without-alert" element={<GapAlertsWithoutAlertPage />} />
          <Route path="/gap-workorders-without-workorder" element={<GapWorkordersWithoutWorkorderPage />} />
          <Route path="/gap-no-digital" element={<GapNoDigitalPage />} />
          <Route path="/gap-cmms-iot-oee-modules-exist-but-real-third" element={<GapCmmsIotOeeModulesExistButRealThirdPage />} />
          <Route path="/gap-no-integration-with-asset-management-purchase-depr" element={<GapNoIntegrationWithAssetManagementPurchaseDeprPage />} />
          <Route path="/gap-no-mobile-app-for-field-technicians-grep-0-react" element={<GapNoMobileAppForFieldTechniciansGrep0ReactPage />} />
          <Route path="/gap-no-webhooks-for-external-systems" element={<GapNoWebhooksForExternalSystemsPage />} />
          <Route path="/gap-limited-notifications-layer" element={<GapLimitedNotificationsLayerPage />} />
                <Route path="/missing-features" element={<MissingFeaturesHub />} />
              <Route path="/production-readiness" element={<ProductionReadiness />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
