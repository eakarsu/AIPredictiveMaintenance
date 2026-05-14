const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all sensor readings
router.get('/', async (req, res) => {
  try {
    const { sensor_id, is_anomaly, limit: queryLimit } = req.query;
    let query = 'SELECT sr.*, s.name as sensor_name, s.type as sensor_type, s.unit FROM sensor_readings sr LEFT JOIN sensors s ON sr.sensor_id = s.id';
    const params = [];
    const conditions = [];

    if (sensor_id) {
      params.push(sensor_id);
      conditions.push(`sr.sensor_id = $${params.length}`);
    }
    if (is_anomaly !== undefined) {
      params.push(is_anomaly === 'true');
      conditions.push(`sr.is_anomaly = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY sr.timestamp DESC';
    if (queryLimit) {
      params.push(parseInt(queryLimit));
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Sensor readings retrieved successfully' });
  } catch (error) {
    console.error('Get sensor readings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET sensor reading by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sr.*, s.name as sensor_name, s.type as sensor_type, s.unit FROM sensor_readings sr LEFT JOIN sensors s ON sr.sensor_id = s.id WHERE sr.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sensor reading not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Sensor reading retrieved successfully' });
  } catch (error) {
    console.error('Get sensor reading error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create sensor reading
router.post('/', async (req, res) => {
  try {
    const { sensor_id, value, timestamp, is_anomaly } = req.body;
    if (!sensor_id || value === undefined) {
      return res.status(400).json({ success: false, message: 'sensor_id and value are required' });
    }
    const result = await pool.query(
      `INSERT INTO sensor_readings (sensor_id, value, timestamp, is_anomaly)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sensor_id, value, timestamp || new Date(), is_anomaly || false]
    );

    // Update sensor last_reading
    await pool.query(
      'UPDATE sensors SET last_reading = $1, last_reading_at = $2 WHERE id = $3',
      [value, timestamp || new Date(), sensor_id]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Sensor reading created successfully' });
  } catch (error) {
    console.error('Create sensor reading error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update sensor reading
router.put('/:id', async (req, res) => {
  try {
    const { sensor_id, value, timestamp, is_anomaly } = req.body;
    const result = await pool.query(
      `UPDATE sensor_readings SET sensor_id = COALESCE($1, sensor_id), value = COALESCE($2, value),
       timestamp = COALESCE($3, timestamp), is_anomaly = COALESCE($4, is_anomaly)
       WHERE id = $5 RETURNING *`,
      [sensor_id, value, timestamp, is_anomaly, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sensor reading not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Sensor reading updated successfully' });
  } catch (error) {
    console.error('Update sensor reading error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE sensor reading
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sensor_readings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sensor reading not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Sensor reading deleted successfully' });
  } catch (error) {
    console.error('Delete sensor reading error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/sensor-readings/ingest - bulk/single ingestion with anomaly detection
router.post('/ingest', async (req, res) => {
  try {
    const body = req.body;
    const readings = body.readings || [body]; // support both single and array

    if (!readings.length) {
      return res.status(400).json({ success: false, message: 'No readings provided' });
    }

    const inserted = [];
    const anomalies = [];

    for (const reading of readings) {
      const { sensor_id, value, unit, timestamp } = reading;
      if (!sensor_id || value === undefined) continue;

      // Fetch sensor thresholds
      const sensorRes = await pool.query(
        'SELECT * FROM sensors WHERE id = $1',
        [sensor_id]
      );
      if (sensorRes.rows.length === 0) continue;
      const sensor = sensorRes.rows[0];

      const ts = timestamp ? new Date(timestamp) : new Date();
      let isAnomaly = false;

      if (sensor.min_threshold !== null && value < sensor.min_threshold) isAnomaly = true;
      if (sensor.max_threshold !== null && value > sensor.max_threshold) isAnomaly = true;

      // Insert reading
      const insertRes = await pool.query(
        `INSERT INTO sensor_readings (sensor_id, value, timestamp, is_anomaly)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [sensor_id, value, ts, isAnomaly]
      );
      const insertedRow = insertRes.rows[0];
      inserted.push(insertedRow);

      // Update sensor last_reading
      await pool.query(
        'UPDATE sensors SET last_reading = $1, last_reading_at = $2 WHERE id = $3',
        [value, ts, sensor_id]
      );

      // Create alert if anomaly
      if (isAnomaly && sensor.equipment_id) {
        try {
          await pool.query(
            `INSERT INTO alerts (equipment_id, sensor_id, type, severity, message, status)
             VALUES ($1, $2, 'anomaly', 'warning', $3, 'active')`,
            [
              sensor.equipment_id,
              sensor_id,
              `Sensor ${sensor.name} reading ${value}${unit || sensor.unit || ''} is outside normal range [${sensor.min_threshold}, ${sensor.max_threshold}]`,
            ]
          );
          anomalies.push({ sensor_id, value, sensor_name: sensor.name });
        } catch (alertErr) {
          console.error('Alert creation error:', alertErr.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: { inserted: inserted.length, anomalies_detected: anomalies.length, anomalies },
      message: `Ingested ${inserted.length} reading(s), ${anomalies.length} anomaly/ies detected`,
    });
  } catch (error) {
    console.error('Ingest sensor readings error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

module.exports = router;
