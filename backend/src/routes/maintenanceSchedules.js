const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all maintenance schedules
router.get('/', async (req, res) => {
  try {
    const { equipment_id, status } = req.query;
    let query = 'SELECT ms.*, e.name as equipment_name FROM maintenance_schedules ms LEFT JOIN equipment e ON ms.equipment_id = e.id';
    const params = [];
    const conditions = [];

    if (equipment_id) {
      params.push(equipment_id);
      conditions.push(`ms.equipment_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`ms.status = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY ms.next_due ASC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Maintenance schedules retrieved successfully' });
  } catch (error) {
    console.error('Get maintenance schedules error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET maintenance schedule by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT ms.*, e.name as equipment_name FROM maintenance_schedules ms LEFT JOIN equipment e ON ms.equipment_id = e.id WHERE ms.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Maintenance schedule retrieved successfully' });
  } catch (error) {
    console.error('Get maintenance schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create maintenance schedule
router.post('/', async (req, res) => {
  try {
    const { equipment_id, title, description, schedule_type, frequency, next_due, priority, assigned_to, status } = req.body;
    if (!equipment_id || !title || !schedule_type) {
      return res.status(400).json({ success: false, message: 'equipment_id, title, and schedule_type are required' });
    }
    const result = await pool.query(
      `INSERT INTO maintenance_schedules (equipment_id, title, description, schedule_type, frequency, next_due, priority, assigned_to, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [equipment_id, title, description || null, schedule_type, frequency || null, next_due || null, priority || 'medium', assigned_to || null, status || 'scheduled']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Maintenance schedule created successfully' });
  } catch (error) {
    console.error('Create maintenance schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update maintenance schedule
router.put('/:id', async (req, res) => {
  try {
    const { equipment_id, title, description, schedule_type, frequency, next_due, priority, assigned_to, status } = req.body;
    const result = await pool.query(
      `UPDATE maintenance_schedules SET equipment_id = COALESCE($1, equipment_id), title = COALESCE($2, title),
       description = COALESCE($3, description), schedule_type = COALESCE($4, schedule_type),
       frequency = COALESCE($5, frequency), next_due = COALESCE($6, next_due),
       priority = COALESCE($7, priority), assigned_to = COALESCE($8, assigned_to), status = COALESCE($9, status)
       WHERE id = $10 RETURNING *`,
      [equipment_id, title, description, schedule_type, frequency, next_due, priority, assigned_to, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Maintenance schedule updated successfully' });
  } catch (error) {
    console.error('Update maintenance schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE maintenance schedule
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_schedules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance schedule not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Maintenance schedule deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance schedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
