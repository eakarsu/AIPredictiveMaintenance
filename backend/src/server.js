const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
app.use('/api/spare-parts', auth, sparePartsRoutes);
app.use('/api/maintenance-logs', auth, maintenanceLogsRoutes);
app.use('/api/cost-records', auth, costRecordsRoutes);
app.use('/api/reports', auth, reportsRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/ai', auth, aiRoutes);

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
