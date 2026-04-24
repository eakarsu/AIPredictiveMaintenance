const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all cost records
router.get('/', async (req, res) => {
  try {
    const { equipment_id, category, budget_category } = req.query;
    let query = 'SELECT cr.*, e.name as equipment_name FROM cost_records cr LEFT JOIN equipment e ON cr.equipment_id = e.id';
    const params = [];
    const conditions = [];

    if (equipment_id) {
      params.push(equipment_id);
      conditions.push(`cr.equipment_id = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`cr.category = $${params.length}`);
    }
    if (budget_category) {
      params.push(budget_category);
      conditions.push(`cr.budget_category = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY cr.date DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Cost records retrieved successfully' });
  } catch (error) {
    console.error('Get cost records error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET cost record by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT cr.*, e.name as equipment_name FROM cost_records cr LEFT JOIN equipment e ON cr.equipment_id = e.id WHERE cr.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cost record not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Cost record retrieved successfully' });
  } catch (error) {
    console.error('Get cost record error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create cost record
router.post('/', async (req, res) => {
  try {
    const { equipment_id, category, description, amount, date, budget_category } = req.body;
    if (!equipment_id || !category || amount === undefined) {
      return res.status(400).json({ success: false, message: 'equipment_id, category, and amount are required' });
    }
    const result = await pool.query(
      `INSERT INTO cost_records (equipment_id, category, description, amount, date, budget_category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [equipment_id, category, description || null, amount, date || new Date(), budget_category || null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Cost record created successfully' });
  } catch (error) {
    console.error('Create cost record error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update cost record
router.put('/:id', async (req, res) => {
  try {
    const { equipment_id, category, description, amount, date, budget_category } = req.body;
    const result = await pool.query(
      `UPDATE cost_records SET equipment_id = COALESCE($1, equipment_id), category = COALESCE($2, category),
       description = COALESCE($3, description), amount = COALESCE($4, amount),
       date = COALESCE($5, date), budget_category = COALESCE($6, budget_category)
       WHERE id = $7 RETURNING *`,
      [equipment_id, category, description, amount, date, budget_category, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cost record not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Cost record updated successfully' });
  } catch (error) {
    console.error('Update cost record error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE cost record
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cost_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cost record not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Cost record deleted successfully' });
  } catch (error) {
    console.error('Delete cost record error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
