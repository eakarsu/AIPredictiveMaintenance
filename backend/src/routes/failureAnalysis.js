const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all failure analyses
router.get('/', async (req, res) => {
  try {
    const { equipment_id, status } = req.query;
    let query = 'SELECT fa.*, e.name as equipment_name FROM failure_analysis fa LEFT JOIN equipment e ON fa.equipment_id = e.id';
    const params = [];
    const conditions = [];

    if (equipment_id) {
      params.push(equipment_id);
      conditions.push(`fa.equipment_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`fa.status = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY fa.failure_date DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Failure analyses retrieved successfully' });
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

module.exports = router;
