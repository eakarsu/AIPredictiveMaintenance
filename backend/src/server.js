const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const auth = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const sensorsRoutes = require('./routes/sensors');
const sensorReadingsRoutes = require('./routes/sensorReadings');
const maintenanceSchedulesRoutes = require('./routes/maintenanceSchedules');
const alertsRoutes = require('./routes/alerts');
const workOrdersRoutes = require('./routes/workOrders');
const failureAnalysisRoutes = require('./routes/failureAnalysis');
const sparePartsRoutes = require('./routes/spareParts');
const maintenanceLogsRoutes = require('./routes/maintenanceLogs');
const costRecordsRoutes = require('./routes/costRecords');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const sensorIngestRoutes = require('./routes/sensorIngest');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/equipment', auth, equipmentRoutes);
app.use('/api/sensors', auth, sensorsRoutes);
app.use('/api/sensor-readings', auth, sensorReadingsRoutes);
app.use('/api/maintenance-schedules', auth, maintenanceSchedulesRoutes);
app.use('/api/alerts', auth, alertsRoutes);
app.use('/api/work-orders', auth, workOrdersRoutes);
app.use('/api/failure-analysis', auth, failureAnalysisRoutes);
app.use('/api/failure-analyses', auth, failureAnalysisRoutes);
app.use('/api/spare-parts', auth, sparePartsRoutes);
app.use('/api/maintenance-logs', auth, maintenanceLogsRoutes);
app.use('/api/cost-records', auth, costRecordsRoutes);
app.use('/api/reports', auth, reportsRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/ai', auth, aiRoutes);
app.use('/api/equipment', auth, sensorIngestRoutes);

// Custom Views (4 endpoints) — mounted BEFORE 404 handler
app.use('/api/custom-views', auth, require('./routes/customViews'));
app.use('/api/lubrication-route-compliance', auth, require('./routes/lubricationRouteCompliance'));

// === Custom Feature Mounts (batch_06) ===
app.use('/api/cf-agentic-maintenance-orchestration', require('./routes/customFeat01_AgenticMaintenanceOrchestration'));
app.use('/api/cf-digital-twin-simulation', require('./routes/customFeat02_DigitalTwinSimulation'));
app.use('/api/cf-anomaly-streaming', require('./routes/customFeat03_AnomalyStreaming'));
app.use('/api/cf-predictive-parts-ordering', require('./routes/customFeat04_PredictivePartsOrdering'));
app.use('/api/cf-maintenance-roi-calculator', require('./routes/customFeat05_MaintenanceRoiCalculator'));


// === Batch 06 Gaps & Frontend Mounts ===
app.use('/api/gap-alerts-without-alert', require('./routes/gapFeat_alerts_without_alert'));
app.use('/api/gap-workorders-without-workorder', require('./routes/gapFeat_workorders_without_workorder'));
app.use('/api/gap-no-digital', require('./routes/gapFeat_no_digital'));
app.use('/api/gap-cmms-iot-oee-modules-exist-but-real-third', require('./routes/gapFeat_cmms_iot_oee_modules_exist_but_real_third'));
app.use('/api/gap-no-integration-with-asset-management-purchase-depr', require('./routes/gapFeat_no_integration_with_asset_management_purchase_depr'));
app.use('/api/gap-no-mobile-app-for-field-technicians-grep-0-react', require('./routes/gapFeat_no_mobile_app_for_field_technicians_grep_0_react'));
app.use('/api/gap-no-webhooks-for-external-systems', require('./routes/gapFeat_no_webhooks_for_external_systems'));
app.use('/api/gap-limited-notifications-layer', require('./routes/gapFeat_limited_notifications_layer'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
