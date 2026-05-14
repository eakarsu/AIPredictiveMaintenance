const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseAIJson(text) {
  // Strategy 1: markdown code block
  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) return JSON.parse(m[1].trim());
  } catch (_) {}
  // Strategy 2: bare JSON object
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch (_) {}
  // Strategy 3: whole text
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

async function getCachedPrediction(equipmentId, endpoint) {
  try {
    await ensureAIPredictionsTable();
    const res = await pool.query(
      `SELECT * FROM ai_predictions
       WHERE equipment_id = $1 AND endpoint = $2
         AND created_at > NOW() - INTERVAL '6 hours'
       ORDER BY created_at DESC LIMIT 1`,
      [equipmentId, endpoint]
    );
    return res.rows[0] || null;
  } catch (_) {
    return null;
  }
}

async function updateEquipmentHealthScore(equipmentId, parsedResponse) {
  try {
    const score =
      parsedResponse?.overall_health_score ||
      parsedResponse?.health_score ||
      parsedResponse?.assessment?.overall_health_score;
    if (score !== undefined && equipmentId) {
      await pool.query(
        'UPDATE equipment SET health_score = $1 WHERE id = $2',
        [parseFloat(score), equipmentId]
      );
    }
  } catch (err) {
    console.error('updateEquipmentHealthScore error:', err.message);
  }
}

// ─── GET /api/ai/history ─────────────────────────────────────────────────────

router.get('/history', async (req, res) => {
  try {
    await ensureAIPredictionsTable();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const userId = req.user?.id || req.user?.userId;

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM ai_predictions WHERE ($1::int IS NULL OR user_id = $1)',
      [userId || null]
    );
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT ap.*, e.name as equipment_name
       FROM ai_predictions ap
       LEFT JOIN equipment e ON ap.equipment_id = e.id
       WHERE ($1::int IS NULL OR ap.user_id = $1)
       ORDER BY ap.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId || null, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('AI history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/ai/predict-failure ────────────────────────────────────────────

router.post('/predict-failure', aiRateLimiter, async (req, res) => {
  try {
    const { equipment_id } = req.body;
    if (!equipment_id) {
      return res.status(400).json({ success: false, message: 'equipment_id is required' });
    }

    // Check cache
    const cached = await getCachedPrediction(equipment_id, 'predict-failure');
    if (cached) {
      return res.json({
        success: true, cached: true,
        data: { equipment_id: parseInt(equipment_id), analysis: cached.result },
        message: 'Returned cached prediction (< 6 hours old)',
      });
    }

    const equipmentResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    if (equipmentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = equipmentResult.rows[0];

    const sensorsResult = await pool.query(
      `SELECT s.*, json_agg(
        json_build_object('value', sr.value, 'timestamp', sr.timestamp, 'is_anomaly', sr.is_anomaly)
        ORDER BY sr.timestamp DESC
      ) FILTER (WHERE sr.id IS NOT NULL) as recent_readings
      FROM sensors s
      LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
      WHERE s.equipment_id = $1
      GROUP BY s.id ORDER BY s.id`,
      [equipment_id]
    );

    const failuresResult = await pool.query(
      'SELECT failure_type, failure_date, root_cause FROM failure_analysis WHERE equipment_id = $1 ORDER BY failure_date DESC LIMIT 10',
      [equipment_id]
    );

    const maintenanceResult = await pool.query(
      'SELECT type, description, performed_at FROM maintenance_logs WHERE equipment_id = $1 ORDER BY performed_at DESC LIMIT 10',
      [equipment_id]
    );

    const systemPrompt = `You are an expert predictive maintenance AI analyst for industrial equipment. Analyze the provided equipment data, sensor readings, failure history, and maintenance records to predict potential failures. Provide your analysis in a structured JSON format with the following fields:
- risk_level: "low", "medium", "high", or "critical"
- health_score: number 0-100
- predicted_failures: array of objects with {component, failure_mode, probability_percent, estimated_time_to_failure, severity}
- contributing_factors: array of strings
- recommended_actions: array of objects with {action, priority, timeline}
- confidence_score: number between 0 and 100
- summary: brief text summary`;

    const prompt = `Analyze this equipment for potential failures:

Equipment: ${JSON.stringify(equipment)}
Sensors and Recent Readings: ${JSON.stringify(sensorsResult.rows)}
Past Failures: ${JSON.stringify(failuresResult.rows)}
Maintenance History: ${JSON.stringify(maintenanceResult.rows)}

Provide a detailed failure prediction analysis.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    // Persist result + update health_score
    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'predict-failure', equipment_id, parsedResponse);
    await updateEquipmentHealthScore(equipment_id, parsedResponse);

    res.json({
      success: true,
      data: {
        equipment_id: parseInt(equipment_id),
        equipment_name: equipment.name,
        analysis: parsedResponse,
      },
      message: 'Failure prediction completed successfully',
    });
  } catch (error) {
    console.error('Predict failure error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/health-assessment ──────────────────────────────────────────

router.post('/health-assessment', aiRateLimiter, async (req, res) => {
  try {
    const { equipment_id } = req.body;
    if (!equipment_id) {
      return res.status(400).json({ success: false, message: 'equipment_id is required' });
    }

    const cached = await getCachedPrediction(equipment_id, 'health-assessment');
    if (cached) {
      return res.json({
        success: true, cached: true,
        data: { equipment_id: parseInt(equipment_id), assessment: cached.result },
        message: 'Returned cached assessment (< 6 hours old)',
      });
    }

    const equipmentResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    if (equipmentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = equipmentResult.rows[0];

    const sensorsResult = await pool.query(
      `SELECT s.name, s.type, s.unit, s.min_threshold, s.max_threshold, s.last_reading, s.last_reading_at, s.status
       FROM sensors s WHERE s.equipment_id = $1`,
      [equipment_id]
    );
    const alertsResult = await pool.query(
      `SELECT type, severity, message, status, created_at FROM alerts WHERE equipment_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [equipment_id]
    );
    const workOrdersResult = await pool.query(
      `SELECT title, status, priority, created_at FROM work_orders WHERE equipment_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [equipment_id]
    );

    const systemPrompt = `You are an expert equipment health assessment AI. Evaluate the overall health of the provided industrial equipment based on sensor data, alerts, and work orders. Return your assessment in structured JSON format with:
- overall_health_score: number 0-100
- health_score: number 0-100 (same as overall_health_score)
- health_grade: "A" (excellent), "B" (good), "C" (fair), "D" (poor), "F" (critical)
- component_health: array of {component, score, status, notes}
- risk_factors: array of strings describing current risk factors
- trends: object with {direction: "improving"|"stable"|"declining", details: string}
- recommendations: array of {action, priority, impact}
- estimated_remaining_life_percent: number 0-100
- summary: brief text summary`;

    const prompt = `Provide a comprehensive health assessment for this equipment:

Equipment: ${JSON.stringify(equipment)}
Current Sensor Status: ${JSON.stringify(sensorsResult.rows)}
Recent Alerts: ${JSON.stringify(alertsResult.rows)}
Recent Work Orders: ${JSON.stringify(workOrdersResult.rows)}

Assess the current health status and provide actionable insights.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'health-assessment', equipment_id, parsedResponse);
    await updateEquipmentHealthScore(equipment_id, parsedResponse);

    res.json({
      success: true,
      data: {
        equipment_id: parseInt(equipment_id),
        equipment_name: equipment.name,
        current_health_score: parseFloat(equipment.health_score),
        assessment: parsedResponse,
      },
      message: 'Health assessment completed successfully',
    });
  } catch (error) {
    console.error('Health assessment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/anomaly-detection ──────────────────────────────────────────

router.post('/anomaly-detection', aiRateLimiter, async (req, res) => {
  try {
    const { sensor_id } = req.body;
    if (!sensor_id) {
      return res.status(400).json({ success: false, message: 'sensor_id is required' });
    }

    const sensorResult = await pool.query(
      `SELECT s.*, e.name as equipment_name FROM sensors s LEFT JOIN equipment e ON s.equipment_id = e.id WHERE s.id = $1`,
      [sensor_id]
    );
    if (sensorResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sensor not found' });
    }
    const sensor = sensorResult.rows[0];

    const readingsResult = await pool.query(
      `SELECT value, timestamp, is_anomaly FROM sensor_readings WHERE sensor_id = $1 ORDER BY timestamp DESC LIMIT 100`,
      [sensor_id]
    );

    const systemPrompt = `You are an expert in industrial sensor data anomaly detection. Analyze the sensor readings and identify anomalies, patterns, and potential issues. Return your analysis in structured JSON format with:
- anomalies_detected: array of {timestamp, value, anomaly_type, severity, description}
- patterns: array of {pattern_type, description, significance}
- statistical_summary: {mean, std_dev, min, max, trend}
- risk_assessment: "low"|"medium"|"high"|"critical"
- recommendations: array of strings
- summary: brief text summary`;

    const prompt = `Analyze these sensor readings for anomalies:

Sensor: ${JSON.stringify(sensor)}
Thresholds: min=${sensor.min_threshold}, max=${sensor.max_threshold}
Recent Readings (newest first): ${JSON.stringify(readingsResult.rows)}

Identify any anomalies, trends, or concerning patterns in the data.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'anomaly-detection', sensor.equipment_id, parsedResponse);

    res.json({
      success: true,
      data: {
        sensor_id: parseInt(sensor_id),
        sensor_name: sensor.name,
        equipment_name: sensor.equipment_name,
        readings_analyzed: readingsResult.rows.length,
        analysis: parsedResponse,
      },
      message: 'Anomaly detection completed successfully',
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/maintenance-recommendation ─────────────────────────────────

router.post('/maintenance-recommendation', aiRateLimiter, async (req, res) => {
  try {
    const { equipment_id } = req.body;
    if (!equipment_id) {
      return res.status(400).json({ success: false, message: 'equipment_id is required' });
    }

    const cached = await getCachedPrediction(equipment_id, 'maintenance-recommendation');
    if (cached) {
      return res.json({
        success: true, cached: true,
        data: { equipment_id: parseInt(equipment_id), recommendations: cached.result },
        message: 'Returned cached recommendation (< 6 hours old)',
      });
    }

    const equipmentResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    if (equipmentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = equipmentResult.rows[0];

    const maintenanceLogsResult = await pool.query(
      `SELECT type, description, performed_by, duration_hours, cost, parts_used, performed_at
       FROM maintenance_logs WHERE equipment_id = $1 ORDER BY performed_at DESC LIMIT 15`,
      [equipment_id]
    );
    const schedulesResult = await pool.query(
      `SELECT title, schedule_type, frequency, next_due, priority, status
       FROM maintenance_schedules WHERE equipment_id = $1`,
      [equipment_id]
    );
    const sensorsResult = await pool.query(
      `SELECT name, type, last_reading, min_threshold, max_threshold, status FROM sensors WHERE equipment_id = $1`,
      [equipment_id]
    );
    const failuresResult = await pool.query(
      `SELECT failure_type, failure_date, root_cause, corrective_action FROM failure_analysis WHERE equipment_id = $1 ORDER BY failure_date DESC LIMIT 5`,
      [equipment_id]
    );

    const systemPrompt = `You are an expert maintenance planning AI. Based on the equipment data, maintenance history, current schedules, sensor readings, and failure history, provide optimized maintenance recommendations. Return your analysis in structured JSON format with:
- maintenance_strategy: "reactive"|"preventive"|"predictive"|"condition_based"
- priority_actions: array of {action, priority, due_date_suggestion, estimated_hours, estimated_cost, reason}
- schedule_optimizations: array of {current_schedule, recommended_change, justification}
- parts_to_stock: array of {part_name, quantity, reason}
- cost_benefit_analysis: {current_estimated_annual_cost, optimized_estimated_annual_cost, potential_savings}
- risk_if_deferred: array of {action, risk_level, potential_impact}
- summary: brief text summary`;

    const prompt = `Provide maintenance recommendations for this equipment:

Equipment: ${JSON.stringify(equipment)}
Maintenance History: ${JSON.stringify(maintenanceLogsResult.rows)}
Current Schedules: ${JSON.stringify(schedulesResult.rows)}
Current Sensor Status: ${JSON.stringify(sensorsResult.rows)}
Failure History: ${JSON.stringify(failuresResult.rows)}

Recommend optimal maintenance actions and scheduling.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'maintenance-recommendation', equipment_id, parsedResponse);

    res.json({
      success: true,
      data: { equipment_id: parseInt(equipment_id), equipment_name: equipment.name, recommendations: parsedResponse },
      message: 'Maintenance recommendations generated successfully',
    });
  } catch (error) {
    console.error('Maintenance recommendation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/cost-optimization ──────────────────────────────────────────

router.post('/cost-optimization', aiRateLimiter, async (req, res) => {
  try {
    const costRecordsResult = await pool.query(
      `SELECT cr.*, e.name as equipment_name, e.type as equipment_type
       FROM cost_records cr LEFT JOIN equipment e ON cr.equipment_id = e.id
       ORDER BY cr.date DESC LIMIT 50`
    );
    const workOrderCostsResult = await pool.query(
      `SELECT wo.title, wo.cost, wo.estimated_hours, wo.actual_hours, wo.status, e.name as equipment_name, e.type as equipment_type
       FROM work_orders wo LEFT JOIN equipment e ON wo.equipment_id = e.id
       WHERE wo.cost IS NOT NULL ORDER BY wo.created_at DESC LIMIT 30`
    );
    const sparePartsResult = await pool.query(
      `SELECT name, part_number, quantity, min_quantity, unit_cost, reorder_status FROM spare_parts ORDER BY unit_cost DESC`
    );
    const costByEquipmentResult = await pool.query(
      `SELECT e.name, e.type, COALESCE(SUM(cr.amount), 0) as total_cost, COUNT(cr.id) as record_count
       FROM equipment e LEFT JOIN cost_records cr ON e.id = cr.equipment_id
       GROUP BY e.id, e.name, e.type ORDER BY total_cost DESC`
    );

    const systemPrompt = `You are an expert maintenance cost optimization AI. Analyze the cost data, work order costs, spare parts inventory, and cost distribution to identify optimization opportunities. Return your analysis in structured JSON format with:
- total_spending: number
- top_cost_drivers: array of {equipment_name, total_cost, category, optimization_potential}
- optimization_opportunities: array of {area, current_cost, potential_savings, recommendation, implementation_difficulty}
- inventory_optimization: array of {part_name, current_stock, recommended_stock, action, cost_impact}
- preventive_vs_corrective: {preventive_cost, corrective_cost, ratio, recommendation}
- budget_recommendations: array of {category, current_allocation, recommended_allocation, justification}
- projected_annual_savings: number
- summary: brief text summary`;

    const prompt = `Analyze maintenance costs and suggest optimizations:

Cost Records: ${JSON.stringify(costRecordsResult.rows)}
Work Order Costs: ${JSON.stringify(workOrderCostsResult.rows)}
Spare Parts Inventory: ${JSON.stringify(sparePartsResult.rows)}
Cost by Equipment: ${JSON.stringify(costByEquipmentResult.rows)}

Identify areas for cost optimization and provide actionable recommendations.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'cost-optimization', null, parsedResponse);

    res.json({
      success: true,
      data: { analysis: parsedResponse },
      message: 'Cost optimization analysis completed successfully',
    });
  } catch (error) {
    console.error('Cost optimization error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/root-cause-analysis ────────────────────────────────────────

router.post('/root-cause-analysis', aiRateLimiter, async (req, res) => {
  try {
    const { equipment_id, failure_type, failure_description, failure_date } = req.body;
    if (!equipment_id || !failure_type) {
      return res.status(400).json({ success: false, message: 'equipment_id and failure_type are required' });
    }

    const equipmentResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    if (equipmentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = equipmentResult.rows[0];

    const pastFailuresResult = await pool.query(
      `SELECT failure_type, failure_date, root_cause, impact, corrective_action
       FROM failure_analysis WHERE equipment_id = $1 ORDER BY failure_date DESC LIMIT 10`,
      [equipment_id]
    );
    const sensorDataResult = await pool.query(
      `SELECT s.name, s.type, s.unit,
        json_agg(json_build_object('value', sr.value, 'timestamp', sr.timestamp, 'is_anomaly', sr.is_anomaly) ORDER BY sr.timestamp DESC) FILTER (WHERE sr.id IS NOT NULL) as readings
       FROM sensors s
       LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
       WHERE s.equipment_id = $1 GROUP BY s.id`,
      [equipment_id]
    );
    const recentMaintenanceResult = await pool.query(
      `SELECT type, description, performed_at, parts_used FROM maintenance_logs WHERE equipment_id = $1 ORDER BY performed_at DESC LIMIT 10`,
      [equipment_id]
    );

    const systemPrompt = `You are an expert root cause analysis AI for industrial equipment failures. Using the failure information, equipment data, sensor readings, past failures, and maintenance history, perform a thorough root cause analysis. Return your analysis in structured JSON format with:
- primary_root_cause: string
- contributing_causes: array of strings
- failure_chain: array of {event, timestamp_relative, description} showing the sequence of events
- evidence: array of {source, finding, relevance}
- similar_past_failures: array of {date, similarity_percent, root_cause}
- corrective_actions: array of {action, priority, responsible_party, timeline}
- prevention_measures: array of {measure, effectiveness_rating, implementation_cost}
- five_why_analysis: array of 5 strings (each asking and answering "why")
- confidence_level: number 0-100
- summary: brief text summary`;

    const prompt = `Perform a root cause analysis for this equipment failure:

Equipment: ${JSON.stringify(equipment)}
Current Failure: Type="${failure_type}", Description="${failure_description || 'Not provided'}", Date="${failure_date || 'Recent'}"
Past Failures: ${JSON.stringify(pastFailuresResult.rows)}
Sensor Data: ${JSON.stringify(sensorDataResult.rows)}
Recent Maintenance: ${JSON.stringify(recentMaintenanceResult.rows)}

Determine the root cause and provide corrective and preventive actions.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'root-cause-analysis', equipment_id, parsedResponse);

    res.json({
      success: true,
      data: { equipment_id: parseInt(equipment_id), equipment_name: equipment.name, failure_type, analysis: parsedResponse },
      message: 'Root cause analysis completed successfully',
    });
  } catch (error) {
    console.error('Root cause analysis error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/what-if-simulation ─────────────────────────────────────────

router.post('/what-if-simulation', aiRateLimiter, async (req, res) => {
  try {
    const { equipment_id, simulated_readings } = req.body;
    if (!equipment_id || !Array.isArray(simulated_readings)) {
      return res.status(400).json({ success: false, message: 'equipment_id and simulated_readings array are required' });
    }

    const equipmentResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    if (equipmentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = equipmentResult.rows[0];

    const sensorsResult = await pool.query(
      `SELECT s.*, json_agg(
        json_build_object('value', sr.value, 'timestamp', sr.timestamp)
        ORDER BY sr.timestamp DESC
      ) FILTER (WHERE sr.id IS NOT NULL) as recent_readings
      FROM sensors s
      LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
      WHERE s.equipment_id = $1
      GROUP BY s.id ORDER BY s.id`,
      [equipment_id]
    );

    // Build simulated sensor data by overriding values
    const simulatedSensors = sensorsResult.rows.map(sensor => {
      const override = simulated_readings.find(r => r.metric === sensor.name || r.metric === sensor.type);
      if (override) {
        return { ...sensor, last_reading: override.value, simulated: true, original_reading: sensor.last_reading };
      }
      return sensor;
    });

    const systemPrompt = `You are an expert predictive maintenance AI. You are running a what-if simulation. You will receive both actual and simulated equipment sensor data. Compare the two scenarios and return JSON with:
- actual_prediction: {risk_level, health_score, key_findings: []}
- simulated_prediction: {risk_level, health_score, key_findings: []}
- impact_analysis: {changes_detected: [], risk_delta: string, health_score_delta: number}
- recommendations: []
- summary: string`;

    const prompt = `What-if simulation for equipment: ${equipment.name}

Actual sensor data: ${JSON.stringify(sensorsResult.rows)}
Simulated overrides: ${JSON.stringify(simulated_readings)}
Combined simulated sensors: ${JSON.stringify(simulatedSensors)}

Compare the actual vs simulated scenario and predict how the simulated conditions affect failure risk.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'what-if-simulation', equipment_id, parsedResponse);

    res.json({
      success: true,
      data: {
        equipment_id: parseInt(equipment_id),
        equipment_name: equipment.name,
        simulated_readings,
        comparison: parsedResponse,
      },
      message: 'What-if simulation completed successfully',
    });
  } catch (error) {
    console.error('What-if simulation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/parts-optimizer ────────────────────────────────────────────

router.post('/parts-optimizer', aiRateLimiter, async (req, res) => {
  try {
    const [equipmentRes, partsRes, failureRes, maintenanceRes] = await Promise.all([
      pool.query(`SELECT id, name, type, health_score, status, last_maintenance, next_maintenance FROM equipment ORDER BY health_score ASC`),
      pool.query(`SELECT * FROM spare_parts ORDER BY reorder_status, unit_cost DESC`),
      pool.query(
        `SELECT fa.equipment_id, e.name as equipment_name, fa.failure_type, COUNT(*) as failure_count
         FROM failure_analysis fa JOIN equipment e ON fa.equipment_id = e.id
         GROUP BY fa.equipment_id, e.name, fa.failure_type ORDER BY failure_count DESC LIMIT 30`
      ),
      pool.query(
        `SELECT equipment_id, parts_used FROM maintenance_logs WHERE parts_used IS NOT NULL ORDER BY performed_at DESC LIMIT 50`
      ),
    ]);

    // Compute failure prediction scores per equipment
    const failureScores = {};
    for (const eq of equipmentRes.rows) {
      const score = 100 - (parseFloat(eq.health_score) || 100);
      failureScores[eq.id] = { name: eq.name, type: eq.type, failure_risk_score: score };
    }

    const systemPrompt = `You are an expert spare parts inventory optimization AI for industrial maintenance. Based on equipment failure prediction scores, current inventory, and maintenance history, recommend optimal spare parts stock levels. Return JSON with:
- recommendations: array of { part_name, part_number, current_stock, recommended_stock, reorder_quantity, priority, equipment_types, reason, estimated_cost }
- critical_shortages: array of { part_name, current_stock, minimum_needed, urgency }
- overstock_items: array of { part_name, current_stock, recommended_stock, cost_to_reduce }
- total_investment_needed: number
- summary: string`;

    const prompt = `Optimize spare parts inventory for our maintenance program:

Equipment with Failure Risk Scores: ${JSON.stringify(failureScores)}
Current Parts Inventory: ${JSON.stringify(partsRes.rows)}
Historical Failure Types by Equipment: ${JSON.stringify(failureRes.rows)}
Recent Parts Usage from Maintenance: ${JSON.stringify(maintenanceRes.rows)}

Recommend optimal stock levels for each spare part.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'parts-optimizer', null, parsedResponse);

    res.json({
      success: true,
      data: {
        equipment_count: equipmentRes.rows.length,
        parts_count: partsRes.rows.length,
        recommendations: parsedResponse,
      },
      message: 'Parts optimization analysis completed',
    });
  } catch (error) {
    console.error('Parts optimizer error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/plan-windows ────────────────────────────────────────────────

router.post('/plan-windows', aiRateLimiter, async (req, res) => {
  try {
    const { production_schedule, date_range_start, date_range_end } = req.body;

    const [equipmentRes, schedulesRes, alertsRes] = await Promise.all([
      pool.query(`SELECT id, name, type, health_score, status, next_maintenance FROM equipment ORDER BY health_score ASC`),
      pool.query(
        `SELECT ms.*, e.name as equipment_name FROM maintenance_schedules ms
         JOIN equipment e ON ms.equipment_id = e.id
         WHERE ms.status IN ('scheduled','overdue') ORDER BY ms.next_due ASC LIMIT 50`
      ),
      pool.query(
        `SELECT a.equipment_id, e.name as equipment_name, COUNT(*) as active_alerts, MAX(a.severity) as max_severity
         FROM alerts a JOIN equipment e ON a.equipment_id = e.id
         WHERE a.status = 'active'
         GROUP BY a.equipment_id, e.name ORDER BY active_alerts DESC`
      ),
    ]);

    const systemPrompt = `You are an expert maintenance window planning AI. Based on equipment health scores, scheduled maintenance, active alerts, and production schedules, recommend optimal maintenance windows that minimize production impact. Return JSON with:
- maintenance_windows: array of { equipment_id, equipment_name, recommended_start, recommended_end, duration_hours, maintenance_type, priority, production_impact, rationale }
- conflicts: array of { equipment_name, conflict_description, resolution }
- optimization_summary: string
- total_downtime_hours: number
- highest_priority_items: array of strings`;

    const prompt = `Plan optimal maintenance windows for our equipment:

Equipment Health Scores: ${JSON.stringify(equipmentRes.rows)}
Pending Maintenance Schedules: ${JSON.stringify(schedulesRes.rows)}
Active Alert Summary: ${JSON.stringify(alertsRes.rows)}
Production Schedule: ${production_schedule || 'Standard 8am-6pm weekdays, no weekends'}
Date Range: ${date_range_start || 'Next 30 days'} to ${date_range_end || 'Next 30 days'}

Recommend optimal maintenance windows minimizing production impact.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'plan-windows', null, parsedResponse);

    res.json({
      success: true,
      data: {
        equipment_analyzed: equipmentRes.rows.length,
        scheduled_maintenance: schedulesRes.rows.length,
        plan: parsedResponse,
      },
      message: 'Maintenance windows planned',
    });
  } catch (error) {
    console.error('Plan windows error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/failures/:id/ai-root-cause (also accessible as /api/ai/failure-root-cause) ────

router.post('/failure-root-cause', aiRateLimiter, async (req, res) => {
  try {
    const { failure_id } = req.body;
    if (!failure_id) {
      return res.status(400).json({ success: false, message: 'failure_id is required' });
    }

    const failureRes = await pool.query(
      `SELECT fa.*, e.name as equipment_name, e.type as equipment_type, e.manufacturer, e.model_number, e.install_date
       FROM failure_analysis fa JOIN equipment e ON fa.equipment_id = e.id
       WHERE fa.id = $1`,
      [failure_id]
    );
    if (failureRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Failure record not found' });
    }
    const failure = failureRes.rows[0];

    const [sensorRes, maintenanceRes] = await Promise.all([
      pool.query(
        `SELECT sr.value, sr.timestamp, sr.is_anomaly, s.name as sensor_name, s.type as sensor_type, s.unit
         FROM sensor_readings sr
         JOIN sensors s ON sr.sensor_id = s.id
         WHERE s.equipment_id = $1 AND sr.timestamp <= $2::date + INTERVAL '1 day'
         ORDER BY sr.timestamp DESC LIMIT 100`,
        [failure.equipment_id, failure.failure_date]
      ),
      pool.query(
        `SELECT type, description, performed_at, cost, parts_used FROM maintenance_logs
         WHERE equipment_id = $1 ORDER BY performed_at DESC LIMIT 20`,
        [failure.equipment_id]
      ),
    ]);

    const systemPrompt = `You are an expert root cause analysis AI for industrial equipment failures. Analyze the failure record, preceding sensor readings, and maintenance history to determine root cause. Return JSON with:
- primary_root_cause: string
- contributing_causes: array of strings
- failure_chain: array of { event, timestamp_relative, description }
- evidence: array of { source, finding, relevance }
- five_why_analysis: array of 5 strings
- corrective_actions: array of { action, priority, responsible_party, timeline }
- prevention_measures: array of { measure, effectiveness_rating, implementation_cost }
- similar_failure_risk: array of { equipment_type, risk_level, recommendation }
- confidence_level: number 0-100
- summary: string`;

    const prompt = `Perform root cause analysis for this failure:

Failure Record: ${JSON.stringify(failure)}
Preceding Sensor Readings (before failure): ${JSON.stringify(sensorRes.rows)}
Maintenance History: ${JSON.stringify(maintenanceRes.rows)}

Determine the root cause and provide prevention recommendations.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'failure-root-cause', failure.equipment_id, parsedResponse);

    // Update the failure record with AI analysis
    await pool.query(
      `UPDATE failure_analysis SET ai_analysis = $1 WHERE id = $2`,
      [JSON.stringify(parsedResponse), failure_id]
    );

    res.json({
      success: true,
      data: {
        failure_id: parseInt(failure_id),
        equipment_name: failure.equipment_name,
        failure_type: failure.failure_type,
        analysis: parsedResponse,
      },
      message: 'Root cause analysis completed',
    });
  } catch (error) {
    console.error('Failure root cause error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/alert-fatigue-reduce ───────────────────────────────────────
// Suppress / cluster low-priority alerts so operators see the signal
router.post('/alert-fatigue-reduce', aiRateLimiter, async (req, res) => {
  try {
    const { window_hours, equipment_id } = req.body;
    const hours = Math.min(Math.max(parseInt(window_hours || 24, 10), 1), 168);

    let alerts = [];
    try {
      const params = [];
      let where = `WHERE created_at >= NOW() - INTERVAL '${hours} hours'`;
      if (equipment_id) {
        params.push(equipment_id);
        where += ` AND equipment_id = $1`;
      }
      const r = await pool.query(
        `SELECT id, equipment_id, severity, source, message, status, created_at
         FROM alerts
         ${where}
         ORDER BY created_at DESC
         LIMIT 500`,
        params
      );
      alerts = r.rows;
    } catch (_) {}

    const summary = alerts.map(a =>
      `id=${a.id} equip=${a.equipment_id} sev=${a.severity} src=${a.source || 'n/a'} status=${a.status || 'open'} at=${a.created_at} msg="${(a.message || '').slice(0, 120)}"`
    ).join('\n');

    const systemPrompt = `You are a maintenance ops AI focused on alert-fatigue reduction. Cluster duplicate or correlated alerts, suppress low-priority noise, surface the few that truly need human attention. Return ONLY valid JSON matching:
{
  "clusters": [{"cluster_id": "string", "alert_ids": [0], "root_signal": "string", "recommended_action": "string", "priority": "low|medium|high|critical"}],
  "suppressible": [{"alert_id": 0, "reason": "string"}],
  "must_action_now": [{"alert_id": 0, "reason": "string"}],
  "summary": "string",
  "fatigue_score": 0
}`;
    const prompt = `Window: last ${hours} hours.\nAlerts (${alerts.length}):\n${summary || 'None'}\n\nReturn JSON only.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'alert-fatigue-reduce', equipment_id || null, parsed);

    res.json({
      success: true,
      data: {
        window_hours: hours,
        alerts_analyzed: alerts.length,
        analysis: parsed || aiResponse,
      },
      message: 'Alert fatigue reduction analysis completed',
    });
  } catch (error) {
    console.error('alert-fatigue-reduce error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/workorder-priority-optimize ────────────────────────────────
// Rank open work orders by impact / urgency given current operational state
router.post('/workorder-priority-optimize', aiRateLimiter, async (req, res) => {
  try {
    const { include_completed } = req.body;

    let workOrders = [];
    try {
      const where = include_completed ? '' : `WHERE status NOT IN ('completed','cancelled')`;
      const r = await pool.query(
        `SELECT id, equipment_id, type, description, priority, status, due_date, estimated_hours, created_at
         FROM work_orders
         ${where}
         ORDER BY created_at DESC
         LIMIT 200`
      );
      workOrders = r.rows;
    } catch (_) {}

    let equipmentSnapshot = [];
    try {
      const r = await pool.query(
        `SELECT id, name, criticality, health_score FROM equipment ORDER BY health_score ASC NULLS LAST LIMIT 200`
      );
      equipmentSnapshot = r.rows;
    } catch (_) {}

    const woSummary = workOrders.map(w =>
      `id=${w.id} equip=${w.equipment_id} type=${w.type || ''} priority=${w.priority || ''} status=${w.status || ''} due=${w.due_date || ''} hours=${w.estimated_hours || '?'} desc="${(w.description || '').slice(0, 120)}"`
    ).join('\n');
    const equipSummary = equipmentSnapshot.map(e =>
      `id=${e.id} name=${e.name} criticality=${e.criticality || 'n/a'} health=${e.health_score || 'n/a'}`
    ).join('\n');

    const systemPrompt = `You are a maintenance planning AI. Re-rank open work orders by combined impact (criticality × failure-risk) and urgency. Return ONLY valid JSON matching:
{
  "ranked_work_orders": [{"work_order_id": 0, "rank": 0, "score": 0, "rationale": "string", "suggested_priority": "low|medium|high|critical", "suggested_due_date": "YYYY-MM-DD"}],
  "deferrable": [{"work_order_id": 0, "reason": "string"}],
  "schedule_conflicts": [{"work_order_id": 0, "issue": "string"}],
  "summary": "string"
}`;
    const prompt = `Work orders:\n${woSummary || 'None'}\n\nEquipment health snapshot:\n${equipSummary || 'None'}\n\nReturn JSON only.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'workorder-priority-optimize', null, parsed);

    res.json({
      success: true,
      data: {
        work_orders_analyzed: workOrders.length,
        analysis: parsed || aiResponse,
      },
      message: 'Work order priority optimization completed',
    });
  } catch (error) {
    console.error('workorder-priority-optimize error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ============================================================
// Apply pass 4 (mechanical backlog) — 3 new AI endpoints
// All return 503 when OPENROUTER_API_KEY is missing.
// ============================================================

function requireKey(res) {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ success: false, message: 'AI not configured. Set OPENROUTER_API_KEY in .env to enable this feature.' });
    return true;
  }
  return false;
}

// ─── POST /api/ai/maintenance-roi-calculator ─────────────────────────────────
// Custom feature suggestion #5 from audit: Maintenance ROI calculator.
// Compares reactive vs preventive vs predictive maintenance economics for
// specific equipment using historical cost records.
router.post('/maintenance-roi-calculator', aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const {
      equipment_id,
      proposed_program_cost = 0,
      expected_failure_reduction_pct = 50,
      analysis_horizon_months = 12,
    } = req.body || {};

    let equipment = null;
    let costs = [];
    let workOrders = [];
    if (equipment_id) {
      try {
        const eqr = await pool.query(`SELECT * FROM equipment WHERE id = $1`, [equipment_id]);
        equipment = eqr.rows[0] || null;
      } catch (_) {}
      try {
        const cr = await pool.query(
          `SELECT cost_type, amount, description, recorded_at
           FROM cost_records WHERE equipment_id = $1
           ORDER BY recorded_at DESC LIMIT 100`,
          [equipment_id]
        );
        costs = cr.rows;
      } catch (_) {}
      try {
        const wr = await pool.query(
          `SELECT type, status, estimated_hours, completed_at, created_at
           FROM work_orders WHERE equipment_id = $1
           ORDER BY created_at DESC LIMIT 50`,
          [equipment_id]
        );
        workOrders = wr.rows;
      } catch (_) {}
    }

    const totalReactive = costs
      .filter((c) => /reactive|emergency|breakdown|repair/i.test(c.cost_type || ''))
      .reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const totalPreventive = costs
      .filter((c) => /preventive|scheduled|planned/i.test(c.cost_type || ''))
      .reduce((s, c) => s + parseFloat(c.amount || 0), 0);

    const systemPrompt = `You are a maintenance ROI analyst. Compute and explain the ROI of upgrading from the current maintenance posture to a more predictive program. Return ONLY valid JSON matching:
{
  "current_posture": "reactive|preventive|mixed|predictive",
  "annualized_failure_cost_estimate": 0,
  "annualized_savings_estimate": 0,
  "payback_period_months": 0,
  "roi_pct": 0,
  "assumptions": ["string"],
  "sensitivity": [{"factor": "string", "downside": "string", "upside": "string"}],
  "recommendation": "string",
  "disclaimer": "Estimates only; actuals depend on real failure rates."
}`;
    const prompt = `Equipment: ${JSON.stringify(equipment)}
Cost history (sample): ${JSON.stringify(costs.slice(0, 30))}
Work-order recent history: ${JSON.stringify(workOrders.slice(0, 20))}
Aggregated reactive spend (sampled): ${totalReactive}
Aggregated preventive spend (sampled): ${totalPreventive}
Proposed program cost (one-time + annual): ${proposed_program_cost}
Expected failure-rate reduction (%): ${expected_failure_reduction_pct}
Analysis horizon (months): ${analysis_horizon_months}

Return JSON only.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'maintenance-roi-calculator', equipment_id || null, parsed);

    res.json({
      success: true,
      data: {
        equipment_id: equipment_id || null,
        analysis: parsed || aiResponse,
        local_aggregates: { totalReactive, totalPreventive },
      },
      message: 'Maintenance ROI analysis completed',
    });
  } catch (error) {
    console.error('maintenance-roi-calculator error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/oee-analyzer ───────────────────────────────────────────────
// Custom: OEE-style analyzer. Takes user-supplied availability/performance/
// quality numbers (or pulls cached signals) and surfaces the dominant losses.
router.post('/oee-analyzer', aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const {
      equipment_id,
      availability_pct,
      performance_pct,
      quality_pct,
      planned_runtime_hours,
      unplanned_downtime_hours,
      reject_rate_pct,
      notes,
    } = req.body || {};

    let equipment = null;
    if (equipment_id) {
      try {
        const r = await pool.query(`SELECT * FROM equipment WHERE id = $1`, [equipment_id]);
        equipment = r.rows[0] || null;
      } catch (_) {}
    }

    const a = parseFloat(availability_pct);
    const p = parseFloat(performance_pct);
    const q = parseFloat(quality_pct);
    let oee = null;
    if (!Number.isNaN(a) && !Number.isNaN(p) && !Number.isNaN(q)) {
      oee = parseFloat(((a / 100) * (p / 100) * (q / 100) * 100).toFixed(2));
    }

    const systemPrompt = `You are an OEE (Overall Equipment Effectiveness) analyst. Identify the dominant OEE-loss bucket (availability, performance, quality) and recommend specific countermeasures. Return ONLY valid JSON matching:
{
  "computed_oee_pct": 0,
  "dominant_loss": "availability|performance|quality",
  "loss_breakdown": [{"category": "string", "loss_pct": 0, "likely_causes": ["string"]}],
  "countermeasures": [{"category": "string", "action": "string", "impact": "low|medium|high", "effort": "low|medium|high"}],
  "world_class_gap_pct": 0,
  "summary": "string",
  "disclaimer": "Estimates only; world-class OEE varies by industry."
}`;
    const prompt = `Equipment: ${JSON.stringify(equipment)}
Availability (%): ${availability_pct ?? 'unspecified'}
Performance (%): ${performance_pct ?? 'unspecified'}
Quality (%): ${quality_pct ?? 'unspecified'}
Planned runtime (h): ${planned_runtime_hours ?? 'unspecified'}
Unplanned downtime (h): ${unplanned_downtime_hours ?? 'unspecified'}
Reject rate (%): ${reject_rate_pct ?? 'unspecified'}
Computed OEE (%): ${oee ?? 'unable to compute (provide A/P/Q)'}
Notes: ${notes || 'none'}

Return JSON only.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'oee-analyzer', equipment_id || null, parsed);

    res.json({
      success: true,
      data: {
        equipment_id: equipment_id || null,
        computed_oee_pct: oee,
        analysis: parsed || aiResponse,
      },
      message: 'OEE analysis completed',
    });
  } catch (error) {
    console.error('oee-analyzer error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// ─── POST /api/ai/predictive-parts-ordering ──────────────────────────────────
// Audit suggestion #4: predictive parts ordering — ADVISORY ONLY (no
// procurement integration). Returns an ordering plan with rationales; the
// user/buyer must execute manually. This is intentionally not wired to any
// real procurement system.
router.post('/predictive-parts-ordering', aiRateLimiter, async (req, res) => {
  if (requireKey(res)) return;
  try {
    const { lead_time_days_buffer = 14, equipment_id, lookahead_days = 90 } = req.body || {};

    let parts = [];
    try {
      const params = [];
      let where = '';
      if (equipment_id) {
        params.push(equipment_id);
        where = `WHERE equipment_id = $1 OR (equipment_id IS NULL)`;
      }
      const r = await pool.query(
        `SELECT id, part_number, name, quantity_on_hand, minimum_quantity, lead_time_days, unit_cost, equipment_id
         FROM spare_parts ${where} ORDER BY id LIMIT 500`,
        params
      );
      parts = r.rows;
    } catch (_) {}

    let recentWO = [];
    try {
      const r = await pool.query(
        `SELECT id, equipment_id, type, status, created_at, completed_at FROM work_orders
         WHERE created_at >= NOW() - INTERVAL '180 days'
         ORDER BY created_at DESC LIMIT 200`
      );
      recentWO = r.rows;
    } catch (_) {}

    const partSummary = parts
      .map(
        (p) =>
          `id=${p.id} pn=${p.part_number || ''} name=${p.name || ''} on_hand=${p.quantity_on_hand} min=${p.minimum_quantity || 0} lead_days=${p.lead_time_days || '?'} unit_cost=${p.unit_cost || '?'} eq=${p.equipment_id || 'shared'}`
      )
      .join('\n');

    const systemPrompt = `You are a predictive spare-parts planner. Given current stock, lead times, and recent work-order activity, return an ADVISORY ordering plan (no actual procurement). Return ONLY valid JSON:
{
  "order_now": [{"part_id": 0, "part_number": "string", "suggested_qty": 0, "rationale": "string", "urgency": "low|medium|high|critical"}],
  "order_soon": [{"part_id": 0, "part_number": "string", "suggested_qty": 0, "rationale": "string", "by_date": "YYYY-MM-DD"}],
  "watchlist": [{"part_id": 0, "rationale": "string"}],
  "estimated_total_spend": 0,
  "assumptions": ["string"],
  "disclaimer": "Advisory only. Verify with procurement before placing orders."
}`;
    const prompt = `Lead-time buffer (days): ${lead_time_days_buffer}
Lookahead window (days): ${lookahead_days}
Spare parts (${parts.length}):
${partSummary || 'None'}

Recent work-order activity (last 180d, ${recentWO.length} rows):
${JSON.stringify(recentWO.slice(0, 50))}

Return JSON only.`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsed = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'predictive-parts-ordering', equipment_id || null, parsed);

    res.json({
      success: true,
      data: {
        parts_evaluated: parts.length,
        equipment_id: equipment_id || null,
        analysis: parsed || aiResponse,
      },
      message: 'Predictive parts-ordering plan generated (advisory only)',
    });
  } catch (error) {
    console.error('predictive-parts-ordering error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

module.exports = router;

