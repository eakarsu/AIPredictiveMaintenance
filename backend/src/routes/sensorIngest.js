const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAIJson(text) {
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) return JSON.parse(m[1].trim());
  } catch (_) {}
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (_) {}
  try { return JSON.parse(text); } catch (_) {}
  return { raw_analysis: text };
}

async function ensureAIPredictionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_predictions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100),
      equipment_id INTEGER,
      result JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function saveAIPrediction(userId, endpoint, equipmentId, result) {
  try {
    await ensureAIPredictionsTable();
    await pool.query(
      `INSERT INTO ai_predictions (user_id, endpoint, equipment_id, result, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId || null, endpoint, equipmentId || null, JSON.stringify(result)]
    );
  } catch (err) {
    console.error('saveAIPrediction error:', err.message);
  }
}

async function ensureSensorReadingsExtended() {
  // Add columns if they don't exist
  try {
    await pool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS equipment_id INTEGER`);
    await pool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS vibration NUMERIC(10,4)`);
    await pool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS temperature NUMERIC(10,4)`);
    await pool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS pressure NUMERIC(10,4)`);
    await pool.query(`ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS current_draw NUMERIC(10,4)`);
  } catch (err) {
    console.error('ensureSensorReadingsExtended error:', err.message);
  }
}

// ─── POST /api/equipment/:id/sensor-data ─────────────────────────────────────
// Accepts { vibration, temperature, pressure, current_draw, timestamp }

router.post('/:id/sensor-data', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    const { vibration, temperature, pressure, current_draw, timestamp } = req.body;

    // Verify equipment exists
    const eqRes = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipmentId]);
    if (eqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = eqRes.rows[0];

    await ensureSensorReadingsExtended();

    const ts = timestamp ? new Date(timestamp) : new Date();

    // Insert a composite sensor reading
    const insertRes = await pool.query(
      `INSERT INTO sensor_readings (sensor_id, value, timestamp, is_anomaly, equipment_id, vibration, temperature, pressure, current_draw)
       SELECT id, COALESCE($2, 0), $3, false, $1, $4, $5, $6, $7
       FROM sensors WHERE equipment_id = $1 ORDER BY id LIMIT 1
       RETURNING *`,
      [equipmentId, temperature || null, ts, vibration || null, temperature || null, pressure || null, current_draw || null]
    );

    // Threshold-based alert creation
    const alerts = [];
    const sensorsRes = await pool.query('SELECT * FROM sensors WHERE equipment_id = $1', [equipmentId]);
    for (const sensor of sensorsRes.rows) {
      let readingValue = null;
      if (sensor.type === 'temperature' || sensor.name.toLowerCase().includes('temp')) readingValue = temperature;
      else if (sensor.type === 'pressure' || sensor.name.toLowerCase().includes('press')) readingValue = pressure;
      else if (sensor.type === 'vibration' || sensor.name.toLowerCase().includes('vibr')) readingValue = vibration;
      else if (sensor.type === 'current' || sensor.name.toLowerCase().includes('current')) readingValue = current_draw;

      if (readingValue !== null && readingValue !== undefined) {
        const exceeded = (sensor.max_threshold && readingValue > parseFloat(sensor.max_threshold)) ||
                         (sensor.min_threshold && readingValue < parseFloat(sensor.min_threshold));
        if (exceeded) {
          const severity = Math.abs(readingValue - (parseFloat(sensor.max_threshold) || parseFloat(sensor.min_threshold))) > 20 ? 'critical' : 'high';
          const alertRes = await pool.query(
            `INSERT INTO alerts (equipment_id, sensor_id, type, severity, message, status, created_at)
             VALUES ($1, $2, 'threshold_exceeded', $3, $4, 'active', NOW()) RETURNING *`,
            [equipmentId, sensor.id, severity, `${sensor.name} reading ${readingValue} ${sensor.unit || ''} exceeded threshold (${sensor.min_threshold || '--'} - ${sensor.max_threshold || '--'})`]
          );
          alerts.push(alertRes.rows[0]);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        reading: insertRes.rows[0] || { equipment_id: equipmentId, vibration, temperature, pressure, current_draw, timestamp: ts },
        alerts_created: alerts,
      },
      message: `Sensor data ingested${alerts.length > 0 ? `, ${alerts.length} alert(s) created` : ''}`,
    });
  } catch (error) {
    console.error('Sensor ingest error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/equipment/:id/detect-anomaly ───────────────────────────────────

router.post('/:id/detect-anomaly', aiRateLimiter, async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);

    const eqRes = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipmentId]);
    if (eqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = eqRes.rows[0];

    // Fetch last 200 sensor readings for this equipment
    const readingsRes = await pool.query(
      `SELECT sr.*, s.name as sensor_name, s.type as sensor_type, s.unit,
              s.min_threshold, s.max_threshold
       FROM sensor_readings sr
       JOIN sensors s ON sr.sensor_id = s.id
       WHERE s.equipment_id = $1
       ORDER BY sr.timestamp DESC
       LIMIT 200`,
      [equipmentId]
    );

    const readings = readingsRes.rows;

    if (readings.length < 2) {
      return res.json({
        success: true,
        data: { message: 'Not enough readings for anomaly detection', readings_count: readings.length },
      });
    }

    // Compute rolling mean and std deviation per sensor type
    const bySensor = {};
    for (const r of readings) {
      if (!bySensor[r.sensor_name]) bySensor[r.sensor_name] = [];
      bySensor[r.sensor_name].push(parseFloat(r.value));
    }

    const anomalySummary = {};
    for (const [sensorName, values] of Object.entries(bySensor)) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const anomalies = values.filter(v => Math.abs(v - mean) > 2 * stdDev);
      anomalySummary[sensorName] = { mean: mean.toFixed(3), std_dev: stdDev.toFixed(3), anomaly_count: anomalies.length, anomaly_values: anomalies.slice(0, 10) };
    }

    const systemPrompt = `You are an expert industrial equipment anomaly detection AI. Given sensor readings statistics (mean, standard deviation, anomaly counts beyond 2σ), interpret the anomalies and recommend actions. Return JSON with:
- anomaly_interpretation: array of { sensor_name, severity, description, likely_cause }
- overall_risk_level: "low"|"medium"|"high"|"critical"
- recommended_actions: array of { action, priority, timeline }
- predictive_insight: string
- summary: string`;

    const prompt = `Analyze anomalies for equipment "${equipment.name}":

Equipment: ${JSON.stringify(equipment)}
Anomaly Summary by Sensor: ${JSON.stringify(anomalySummary)}
Total readings analyzed: ${readings.length}

Interpret these anomalies and recommend actions.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'detect-anomaly', equipmentId, parsedResponse);

    res.json({
      success: true,
      data: {
        equipment_id: equipmentId,
        equipment_name: equipment.name,
        readings_analyzed: readings.length,
        statistical_summary: anomalySummary,
        ai_analysis: parsedResponse,
      },
      message: 'Anomaly detection completed',
    });
  } catch (error) {
    console.error('Detect anomaly error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/equipment/:id/ai-cost-forecast ─────────────────────────────────

router.post('/:id/ai-cost-forecast', aiRateLimiter, async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);

    const eqRes = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipmentId]);
    if (eqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = eqRes.rows[0];

    const [maintenanceRes, failureRes, costRes, partsRes] = await Promise.all([
      pool.query(
        `SELECT type, description, duration_hours, cost, performed_at FROM maintenance_logs WHERE equipment_id = $1 ORDER BY performed_at DESC LIMIT 30`,
        [equipmentId]
      ),
      pool.query(
        `SELECT failure_type, failure_date, root_cause, corrective_action FROM failure_analysis WHERE equipment_id = $1 ORDER BY failure_date DESC LIMIT 20`,
        [equipmentId]
      ),
      pool.query(
        `SELECT category, amount, date FROM cost_records WHERE equipment_id = $1 ORDER BY date DESC LIMIT 50`,
        [equipmentId]
      ),
      pool.query(
        `SELECT name, part_number, quantity, unit_cost, reorder_status FROM spare_parts ORDER BY unit_cost DESC LIMIT 20`
      ),
    ]);

    const systemPrompt = `You are an expert maintenance cost forecasting AI. Based on maintenance history, failure rates, and parts costs, forecast 12-month maintenance costs. Return JSON with:
- monthly_forecast: array of 12 objects { month, estimated_cost, description, probability_of_major_event }
- total_annual: number
- critical_investments: array of { item, cost, justification, recommended_month }
- cost_reduction_opportunities: array of { opportunity, potential_savings, implementation }
- assumptions: array of strings
- confidence_level: number 0-100`;

    const prompt = `Forecast 12-month maintenance costs for equipment "${equipment.name}":

Equipment Details: ${JSON.stringify(equipment)}
Maintenance History: ${JSON.stringify(maintenanceRes.rows)}
Failure History: ${JSON.stringify(failureRes.rows)}
Past Cost Records: ${JSON.stringify(costRes.rows)}
Parts Inventory (for cost reference): ${JSON.stringify(partsRes.rows)}

Provide a detailed 12-month cost forecast.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'ai-cost-forecast', equipmentId, parsedResponse);

    res.json({
      success: true,
      data: {
        equipment_id: equipmentId,
        equipment_name: equipment.name,
        forecast: parsedResponse,
      },
      message: 'Cost forecast generated',
    });
  } catch (error) {
    console.error('Cost forecast error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

module.exports = router;
