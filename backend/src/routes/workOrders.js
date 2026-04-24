const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all work orders
router.get('/', async (req, res) => {
  try {
    const { equipment_id, status, priority } = req.query;
    let query = 'SELECT wo.*, e.name as equipment_name FROM work_orders wo LEFT JOIN equipment e ON wo.equipment_id = e.id';
    const params = [];
    const conditions = [];

    if (equipment_id) {
      params.push(equipment_id);
      conditions.push(`wo.equipment_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`wo.status = $${params.length}`);
    }
    if (priority) {
      params.push(priority);
      conditions.push(`wo.priority = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY wo.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Work orders retrieved successfully' });
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET work order by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT wo.*, e.name as equipment_name FROM work_orders wo LEFT JOIN equipment e ON wo.equipment_id = e.id WHERE wo.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Work order retrieved successfully' });
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create work order
router.post('/', async (req, res) => {
  try {
    const { equipment_id, title, description, priority, status, assigned_to, estimated_hours, actual_hours, cost, due_date, completed_at } = req.body;
    if (!equipment_id || !title) {
      return res.status(400).json({ success: false, message: 'equipment_id and title are required' });
    }
    const result = await pool.query(
      `INSERT INTO work_orders (equipment_id, title, description, priority, status, assigned_to, estimated_hours, actual_hours, cost, due_date, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [equipment_id, title, description || null, priority || 'medium', status || 'open', assigned_to || null, estimated_hours || null, actual_hours || null, cost || null, due_date || null, completed_at || null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Work order created successfully' });
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update work order
router.put('/:id', async (req, res) => {
  try {
    const { equipment_id, title, description, priority, status, assigned_to, estimated_hours, actual_hours, cost, due_date, completed_at } = req.body;
    const result = await pool.query(
      `UPDATE work_orders SET equipment_id = COALESCE($1, equipment_id), title = COALESCE($2, title),
       description = COALESCE($3, description), priority = COALESCE($4, priority), status = COALESCE($5, status),
       assigned_to = COALESCE($6, assigned_to), estimated_hours = COALESCE($7, estimated_hours),
       actual_hours = COALESCE($8, actual_hours), cost = COALESCE($9, cost),
       due_date = COALESCE($10, due_date), completed_at = COALESCE($11, completed_at)
       WHERE id = $12 RETURNING *`,
      [equipment_id, title, description, priority, status, assigned_to, estimated_hours, actual_hours, cost, due_date, completed_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Work order updated successfully' });
  } catch (error) {
    console.error('Update work order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE work order
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM work_orders WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Delete work order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
