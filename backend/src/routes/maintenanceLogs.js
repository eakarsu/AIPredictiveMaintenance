const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all maintenance logs
router.get('/', async (req, res) => {
  try {
    const { equipment_id, type } = req.query;
    let query = 'SELECT ml.*, e.name as equipment_name FROM maintenance_logs ml LEFT JOIN equipment e ON ml.equipment_id = e.id';
    const params = [];
    const conditions = [];

    if (equipment_id) {
      params.push(equipment_id);
      conditions.push(`ml.equipment_id = $${params.length}`);
    }
    if (type) {
      params.push(type);
      conditions.push(`ml.type = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY ml.performed_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Maintenance logs retrieved successfully' });
  } catch (error) {
    console.error('Get maintenance logs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET maintenance log by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT ml.*, e.name as equipment_name FROM maintenance_logs ml LEFT JOIN equipment e ON ml.equipment_id = e.id WHERE ml.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance log not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Maintenance log retrieved successfully' });
  } catch (error) {
    console.error('Get maintenance log error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create maintenance log
router.post('/', async (req, res) => {
  try {
    const { equipment_id, work_order_id, type, description, performed_by, duration_hours, cost, parts_used, notes, performed_at } = req.body;
    if (!equipment_id || !type) {
      return res.status(400).json({ success: false, message: 'equipment_id and type are required' });
    }
    const result = await pool.query(
      `INSERT INTO maintenance_logs (equipment_id, work_order_id, type, description, performed_by, duration_hours, cost, parts_used, notes, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [equipment_id, work_order_id || null, type, description || null, performed_by || null, duration_hours || null, cost || null, parts_used || null, notes || null, performed_at || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Maintenance log created successfully' });
  } catch (error) {
    console.error('Create maintenance log error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update maintenance log
router.put('/:id', async (req, res) => {
  try {
    const { equipment_id, work_order_id, type, description, performed_by, duration_hours, cost, parts_used, notes, performed_at } = req.body;
    const result = await pool.query(
      `UPDATE maintenance_logs SET equipment_id = COALESCE($1, equipment_id), work_order_id = COALESCE($2, work_order_id),
       type = COALESCE($3, type), description = COALESCE($4, description), performed_by = COALESCE($5, performed_by),
       duration_hours = COALESCE($6, duration_hours), cost = COALESCE($7, cost), parts_used = COALESCE($8, parts_used),
       notes = COALESCE($9, notes), performed_at = COALESCE($10, performed_at)
       WHERE id = $11 RETURNING *`,
      [equipment_id, work_order_id, type, description, performed_by, duration_hours, cost, parts_used, notes, performed_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance log not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Maintenance log updated successfully' });
  } catch (error) {
    console.error('Update maintenance log error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE maintenance log
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_logs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance log not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Maintenance log deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance log error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
