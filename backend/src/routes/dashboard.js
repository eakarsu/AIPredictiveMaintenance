const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET dashboard aggregated stats
router.get('/', async (req, res) => {
  try {
    // Run all queries in parallel
    const [
      equipmentStats,
      alertStats,
      workOrderStats,
      recentAlerts,
      upcomingMaintenance,
      healthScores,
      costSummary,
      sensorAnomalies,
      sparePartsLow,
      equipmentByStatus
    ] = await Promise.all([
      // Total equipment count and average health
      pool.query(`
        SELECT
          COUNT(*) as total_equipment,
          ROUND(AVG(health_score), 2) as avg_health_score,
          COUNT(*) FILTER (WHERE status = 'operational') as operational_count,
          COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_count,
          COUNT(*) FILTER (WHERE status = 'warning') as warning_count,
          COUNT(*) FILTER (WHERE status = 'offline') as offline_count
        FROM equipment
      `),

      // Alert statistics
      pool.query(`
        SELECT
          COUNT(*) as total_alerts,
          COUNT(*) FILTER (WHERE status = 'active') as active_alerts,
          COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'active') as critical_alerts,
          COUNT(*) FILTER (WHERE severity = 'warning' AND status = 'active') as warning_alerts,
          COUNT(*) FILTER (WHERE severity = 'info' AND status = 'active') as info_alerts
        FROM alerts
      `),

      // Work order statistics
      pool.query(`
        SELECT
          COUNT(*) as total_work_orders,
          COUNT(*) FILTER (WHERE status = 'open') as open_count,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
          COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
          COALESCE(SUM(cost) FILTER (WHERE status = 'completed'), 0) as total_completed_cost
        FROM work_orders
      `),

      // Recent active alerts (last 5)
      pool.query(`
        SELECT a.*, e.name as equipment_name
        FROM alerts a
        LEFT JOIN equipment e ON a.equipment_id = e.id
        WHERE a.status = 'active'
        ORDER BY a.created_at DESC
        LIMIT 5
      `),

      // Upcoming maintenance (next 5)
      pool.query(`
        SELECT ms.*, e.name as equipment_name
        FROM maintenance_schedules ms
        LEFT JOIN equipment e ON ms.equipment_id = e.id
        WHERE ms.status IN ('scheduled', 'in_progress')
        ORDER BY ms.next_due ASC
        LIMIT 5
      `),

      // Equipment with lowest health scores
      pool.query(`
        SELECT id, name, type, health_score, status
        FROM equipment
        ORDER BY health_score ASC
        LIMIT 5
      `),

      // Cost summary by category
      pool.query(`
        SELECT
          budget_category,
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as record_count
        FROM cost_records
        GROUP BY budget_category
        ORDER BY total_amount DESC
      `),

      // Recent anomalies count
      pool.query(`
        SELECT COUNT(*) as anomaly_count
        FROM sensor_readings
        WHERE is_anomaly = TRUE AND timestamp > NOW() - INTERVAL '24 hours'
      `),

      // Spare parts needing reorder
      pool.query(`
        SELECT id, name, part_number, quantity, min_quantity
        FROM spare_parts
        WHERE quantity <= min_quantity
        ORDER BY quantity ASC
      `),

      // Equipment count by status
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM equipment
        GROUP BY status
        ORDER BY count DESC
      `)
    ]);

    const dashboard = {
      equipment: {
        ...equipmentStats.rows[0],
        by_status: equipmentByStatus.rows,
        lowest_health: healthScores.rows,
      },
      alerts: {
        ...alertStats.rows[0],
        recent: recentAlerts.rows,
      },
      work_orders: workOrderStats.rows[0],
      upcoming_maintenance: upcomingMaintenance.rows,
      costs: {
        by_category: costSummary.rows,
      },
      sensor_anomalies_24h: parseInt(sensorAnomalies.rows[0].anomaly_count),
      spare_parts_low_stock: sparePartsLow.rows,
    };

    res.json({ success: true, data: dashboard, message: 'Dashboard data retrieved successfully' });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
