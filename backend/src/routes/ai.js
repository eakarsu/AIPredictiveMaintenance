const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/aiService');

// POST /api/ai/predict-failure
router.post('/predict-failure', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    if (!equipment_id) {
      return res.status(400).json({ success: false, message: 'equipment_id is required' });
    }

    // Fetch equipment data
    const equipmentResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    if (equipmentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    const equipment = equipmentResult.rows[0];

    // Fetch sensor data with recent readings
    const sensorsResult = await pool.query(
      `SELECT s.*, json_agg(
        json_build_object('value', sr.value, 'timestamp', sr.timestamp, 'is_anomaly', sr.is_anomaly)
        ORDER BY sr.timestamp DESC
      ) FILTER (WHERE sr.id IS NOT NULL) as recent_readings
      FROM sensors s
      LEFT JOIN sensor_readings sr ON s.id = sr.sensor_id
      WHERE s.equipment_id = $1
      GROUP BY s.id
      ORDER BY s.id`,
      [equipment_id]
    );

    // Fetch past failures
    const failuresResult = await pool.query(
      'SELECT failure_type, failure_date, root_cause FROM failure_analysis WHERE equipment_id = $1 ORDER BY failure_date DESC LIMIT 10',
      [equipment_id]
    );

    // Fetch maintenance history
    const maintenanceResult = await pool.query(
      'SELECT type, description, performed_at FROM maintenance_logs WHERE equipment_id = $1 ORDER BY performed_at DESC LIMIT 10',
      [equipment_id]
    );

    const systemPrompt = `You are an expert predictive maintenance AI analyst for industrial equipment. Analyze the provided equipment data, sensor readings, failure history, and maintenance records to predict potential failures. Provide your analysis in a structured JSON format with the following fields:
- risk_level: "low", "medium", "high", or "critical"
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

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse);
    } catch {
      parsedResponse = { raw_analysis: aiResponse };
    }

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

// POST /api/ai/health-assessment
router.post('/health-assessment', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    if (!equipment_id) {
      return res.status(400).json({ success: false, message: 'equipment_id is required' });
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

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse);
    } catch {
      parsedResponse = { raw_analysis: aiResponse };
    }

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

// POST /api/ai/anomaly-detection
router.post('/anomaly-detection', async (req, res) => {
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

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse);
    } catch {
      parsedResponse = { raw_analysis: aiResponse };
    }

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

// POST /api/ai/maintenance-recommendation
router.post('/maintenance-recommendation', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    if (!equipment_id) {
      return res.status(400).json({ success: false, message: 'equipment_id is required' });
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

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse);
    } catch {
      parsedResponse = { raw_analysis: aiResponse };
    }

    res.json({
      success: true,
      data: {
        equipment_id: parseInt(equipment_id),
        equipment_name: equipment.name,
        recommendations: parsedResponse,
      },
      message: 'Maintenance recommendations generated successfully',
    });
  } catch (error) {
    console.error('Maintenance recommendation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// POST /api/ai/cost-optimization
router.post('/cost-optimization', async (req, res) => {
  try {
    const costRecordsResult = await pool.query(
      `SELECT cr.*, e.name as equipment_name, e.type as equipment_type
       FROM cost_records cr LEFT JOIN equipment e ON cr.equipment_id = e.id
       ORDER BY cr.date DESC LIMIT 50`
    );

    const workOrderCostsResult = await pool.query(
      `SELECT wo.title, wo.cost, wo.estimated_hours, wo.actual_hours, wo.status, e.name as equipment_name, e.type as equipment_type
       FROM work_orders wo LEFT JOIN equipment e ON wo.equipment_id = e.id
       WHERE wo.cost IS NOT NULL
       ORDER BY wo.created_at DESC LIMIT 30`
    );

    const sparePartsResult = await pool.query(
      `SELECT name, part_number, quantity, min_quantity, unit_cost, reorder_status FROM spare_parts ORDER BY unit_cost DESC`
    );

    const costByEquipmentResult = await pool.query(
      `SELECT e.name, e.type, COALESCE(SUM(cr.amount), 0) as total_cost, COUNT(cr.id) as record_count
       FROM equipment e LEFT JOIN cost_records cr ON e.id = cr.equipment_id
       GROUP BY e.id, e.name, e.type
       ORDER BY total_cost DESC`
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

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse);
    } catch {
      parsedResponse = { raw_analysis: aiResponse };
    }

    res.json({
      success: true,
      data: {
        analysis: parsedResponse,
      },
      message: 'Cost optimization analysis completed successfully',
    });
  } catch (error) {
    console.error('Cost optimization error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// POST /api/ai/root-cause-analysis
router.post('/root-cause-analysis', async (req, res) => {
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
       WHERE s.equipment_id = $1
       GROUP BY s.id`,
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

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse);
    } catch {
      parsedResponse = { raw_analysis: aiResponse };
    }

    res.json({
      success: true,
      data: {
        equipment_id: parseInt(equipment_id),
        equipment_name: equipment.name,
        failure_type,
        analysis: parsedResponse,
      },
      message: 'Root cause analysis completed successfully',
    });
  } catch (error) {
    console.error('Root cause analysis error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

module.exports = router;
