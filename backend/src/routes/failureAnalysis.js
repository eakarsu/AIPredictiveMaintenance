const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { callOpenRouter } = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

function parseAIJson(text) {
  try { const m = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) return JSON.parse(m[1].trim()); } catch (_) {}
  try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {}
  try { return JSON.parse(text); } catch (_) {}
  return { raw_analysis: text };
}

async function saveAIPrediction(userId, endpoint, equipmentId, result) {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS ai_predictions (id SERIAL PRIMARY KEY, user_id INTEGER, endpoint VARCHAR(100), equipment_id INTEGER, result JSONB, created_at TIMESTAMP DEFAULT NOW())`);
    await pool.query(`INSERT INTO ai_predictions (user_id, endpoint, equipment_id, result) VALUES ($1,$2,$3,$4)`,
      [userId || null, endpoint, equipmentId || null, JSON.stringify(result)]);
  } catch (err) { console.error('saveAIPrediction error:', err.message); }
}

// GET all failure analyses (with pagination)
router.get('/', async (req, res) => {
  try {
    const { equipment_id, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const params = [];
    const conditions = [];

    if (equipment_id) { params.push(equipment_id); conditions.push(`fa.equipment_id = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`fa.status = $${params.length}`); }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM failure_analysis fa${whereClause}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(limit); params.push(offset);
    const result = await pool.query(
      `SELECT fa.*, e.name as equipment_name FROM failure_analysis fa
       LEFT JOIN equipment e ON fa.equipment_id = e.id
       ${whereClause} ORDER BY fa.failure_date DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Failure analyses retrieved successfully',
    });
  } catch (error) {
    console.error('Get failure analyses error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET failure analysis by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT fa.*, e.name as equipment_name FROM failure_analysis fa LEFT JOIN equipment e ON fa.equipment_id = e.id WHERE fa.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Failure analysis not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Failure analysis retrieved successfully' });
  } catch (error) {
    console.error('Get failure analysis error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create failure analysis
router.post('/', async (req, res) => {
  try {
    const { equipment_id, failure_date, failure_type, root_cause, impact, corrective_action, prevention_plan, ai_analysis, status } = req.body;
    if (!equipment_id || !failure_date || !failure_type) {
      return res.status(400).json({ success: false, message: 'equipment_id, failure_date, and failure_type are required' });
    }
    const result = await pool.query(
      `INSERT INTO failure_analysis (equipment_id, failure_date, failure_type, root_cause, impact, corrective_action, prevention_plan, ai_analysis, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [equipment_id, failure_date, failure_type, root_cause || null, impact || null, corrective_action || null, prevention_plan || null, ai_analysis || null, status || 'open']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Failure analysis created successfully' });
  } catch (error) {
    console.error('Create failure analysis error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update failure analysis
router.put('/:id', async (req, res) => {
  try {
    const { equipment_id, failure_date, failure_type, root_cause, impact, corrective_action, prevention_plan, ai_analysis, status } = req.body;
    const result = await pool.query(
      `UPDATE failure_analysis SET equipment_id = COALESCE($1, equipment_id), failure_date = COALESCE($2, failure_date),
       failure_type = COALESCE($3, failure_type), root_cause = COALESCE($4, root_cause), impact = COALESCE($5, impact),
       corrective_action = COALESCE($6, corrective_action), prevention_plan = COALESCE($7, prevention_plan),
       ai_analysis = COALESCE($8, ai_analysis), status = COALESCE($9, status)
       WHERE id = $10 RETURNING *`,
      [equipment_id, failure_date, failure_type, root_cause, impact, corrective_action, prevention_plan, ai_analysis, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Failure analysis not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Failure analysis updated successfully' });
  } catch (error) {
    console.error('Update failure analysis error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE failure analysis
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM failure_analysis WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Failure analysis not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Failure analysis deleted successfully' });
  } catch (error) {
    console.error('Delete failure analysis error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/failure-analysis/:id/ai-root-cause
router.post('/:id/ai-root-cause', aiRateLimiter, async (req, res) => {
  try {
    const failureId = parseInt(req.params.id);
    const failureRes = await pool.query(
      `SELECT fa.*, e.name as equipment_name, e.type as equipment_type, e.manufacturer, e.model_number
       FROM failure_analysis fa JOIN equipment e ON fa.equipment_id = e.id WHERE fa.id = $1`,
      [failureId]
    );
    if (failureRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Failure record not found' });
    }
    const failure = failureRes.rows[0];

    const [sensorRes, maintenanceRes] = await Promise.all([
      pool.query(
        `SELECT sr.value, sr.timestamp, sr.is_anomaly, s.name as sensor_name, s.type as sensor_type, s.unit
         FROM sensor_readings sr JOIN sensors s ON sr.sensor_id = s.id
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

    const systemPrompt = `You are an expert root cause analysis AI for industrial equipment failures. Analyze the failure record, preceding sensor readings, and maintenance history. Return JSON with:
- primary_root_cause: string
- contributing_causes: array of strings
- failure_chain: array of { event, timestamp_relative, description }
- evidence: array of { source, finding, relevance }
- five_why_analysis: array of 5 strings
- corrective_actions: array of { action, priority, responsible_party, timeline }
- prevention_measures: array of { measure, effectiveness_rating, implementation_cost }
- confidence_level: number 0-100
- summary: string`;

    const prompt = `Perform root cause analysis for this failure:

Failure Record: ${JSON.stringify(failure)}
Preceding Sensor Readings: ${JSON.stringify(sensorRes.rows)}
Maintenance History: ${JSON.stringify(maintenanceRes.rows)}`;

    const aiResponse = await callOpenRouter(prompt, systemPrompt);
    const parsedResponse = parseAIJson(aiResponse);

    const userId = req.user?.id || req.user?.userId;
    await saveAIPrediction(userId, 'failure-root-cause', failure.equipment_id, parsedResponse);

    await pool.query(`UPDATE failure_analysis SET ai_analysis = $1 WHERE id = $2`, [JSON.stringify(parsedResponse), failureId]);

    res.json({
      success: true,
      data: { failure_id: failureId, equipment_name: failure.equipment_name, failure_type: failure.failure_type, analysis: parsedResponse },
      message: 'Root cause analysis completed',
    });
  } catch (error) {
    console.error('Root cause error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

module.exports = router;
