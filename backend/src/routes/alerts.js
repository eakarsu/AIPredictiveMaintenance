const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// POST /api/alerts/auto-evaluate
router.post('/auto-evaluate', async (req, res) => {
  try {
    const created = [];

    // 1. Equipment with low health_score
    const lowHealthEq = await pool.query(
      `SELECT * FROM equipment WHERE health_score < 70`
    );
    for (const eq of lowHealthEq.rows) {
      const existingAlert = await pool.query(
        `SELECT id FROM alerts WHERE equipment_id = $1 AND status = 'active' AND type = 'health' LIMIT 1`,
        [eq.id]
      );
      if (existingAlert.rows.length === 0) {
        await pool.query(
          `INSERT INTO alerts (equipment_id, type, severity, message, status)
           VALUES ($1, 'health', $2, $3, 'active')`,
          [
            eq.id,
            eq.health_score < 50 ? 'critical' : 'warning',
            `Equipment "${eq.name}" has a low health score of ${eq.health_score}%`,
          ]
        );
        created.push({ type: 'health', equipment: eq.name });
      }
    }

    // 2. Sensors with recent anomalies (last 24h)
    const anomalySensors = await pool.query(
      `SELECT DISTINCT s.id, s.name, s.equipment_id
       FROM sensor_readings sr
       JOIN sensors s ON sr.sensor_id = s.id
       WHERE sr.is_anomaly = true
         AND sr.timestamp > NOW() - INTERVAL '24 hours'
         AND s.equipment_id IS NOT NULL`
    );
    for (const sensor of anomalySensors.rows) {
      const existingAlert = await pool.query(
        `SELECT id FROM alerts WHERE sensor_id = $1 AND status = 'active' AND type = 'anomaly'
         AND created_at > NOW() - INTERVAL '24 hours' LIMIT 1`,
        [sensor.id]
      );
      if (existingAlert.rows.length === 0) {
        await pool.query(
          `INSERT INTO alerts (equipment_id, sensor_id, type, severity, message, status)
           VALUES ($1, $2, 'anomaly', 'warning', $3, 'active')`,
          [
            sensor.equipment_id,
            sensor.id,
            `Sensor "${sensor.name}" detected anomalous readings in the last 24 hours`,
          ]
        );
        created.push({ type: 'anomaly', sensor: sensor.name });
      }
    }

    res.json({
      success: true,
      data: { alerts_created: created.length, details: created },
      message: `Auto-evaluation complete. Created ${created.length} alert(s).`,
    });
  } catch (error) {
    console.error('Auto-evaluate error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// GET all alerts
router.get('/', async (req, res) => {
  try {
    const { equipment_id, status, severity } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let baseQuery = 'FROM alerts a LEFT JOIN equipment e ON a.equipment_id = e.id LEFT JOIN sensors s ON a.sensor_id = s.id';
    const params = [];
    const conditions = [];

    if (equipment_id) {
      params.push(equipment_id);
      conditions.push(`a.equipment_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (severity) {
      params.push(severity);
      conditions.push(`a.severity = $${params.length}`);
    }
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const query = `SELECT a.*, e.name as equipment_name, s.name as sensor_name ${baseQuery}${whereClause} ORDER BY a.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Alerts retrieved successfully',
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET alert by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT a.*, e.name as equipment_name, s.name as sensor_name FROM alerts a LEFT JOIN equipment e ON a.equipment_id = e.id LEFT JOIN sensors s ON a.sensor_id = s.id WHERE a.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Alert retrieved successfully' });
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create alert
router.post('/', async (req, res) => {
  try {
    const { equipment_id, sensor_id, type, severity, message, status } = req.body;
    if (!equipment_id || !type || !severity || !message) {
      return res.status(400).json({ success: false, message: 'equipment_id, type, severity, and message are required' });
    }
    const result = await pool.query(
      `INSERT INTO alerts (equipment_id, sensor_id, type, severity, message, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [equipment_id, sensor_id || null, type, severity, message, status || 'active']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Alert created successfully' });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update alert
router.put('/:id', async (req, res) => {
  try {
    const { equipment_id, sensor_id, type, severity, message, status, acknowledged_by, acknowledged_at } = req.body;
    const result = await pool.query(
      `UPDATE alerts SET equipment_id = COALESCE($1, equipment_id), sensor_id = COALESCE($2, sensor_id),
       type = COALESCE($3, type), severity = COALESCE($4, severity), message = COALESCE($5, message),
       status = COALESCE($6, status), acknowledged_by = COALESCE($7, acknowledged_by),
       acknowledged_at = COALESCE($8, acknowledged_at)
       WHERE id = $9 RETURNING *`,
      [equipment_id, sensor_id, type, severity, message, status, acknowledged_by, acknowledged_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Alert updated successfully' });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE alert
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
