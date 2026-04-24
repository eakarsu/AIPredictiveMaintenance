const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all spare parts
router.get('/', async (req, res) => {
  try {
    const { category, reorder_status } = req.query;
    let query = 'SELECT * FROM spare_parts';
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (reorder_status) {
      params.push(reorder_status);
      conditions.push(`reorder_status = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY id';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Spare parts retrieved successfully' });
  } catch (error) {
    console.error('Get spare parts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET spare part by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spare_parts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Spare part retrieved successfully' });
  } catch (error) {
    console.error('Get spare part error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create spare part
router.post('/', async (req, res) => {
  try {
    const { name, part_number, category, quantity, min_quantity, unit_cost, supplier, location, compatible_equipment, reorder_status } = req.body;
    if (!name || !part_number) {
      return res.status(400).json({ success: false, message: 'name and part_number are required' });
    }
    const result = await pool.query(
      `INSERT INTO spare_parts (name, part_number, category, quantity, min_quantity, unit_cost, supplier, location, compatible_equipment, reorder_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, part_number, category || null, quantity || 0, min_quantity || 1, unit_cost || null, supplier || null, location || null, compatible_equipment || null, reorder_status || 'in_stock']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Spare part created successfully' });
  } catch (error) {
    console.error('Create spare part error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Part number already exists' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update spare part
router.put('/:id', async (req, res) => {
  try {
    const { name, part_number, category, quantity, min_quantity, unit_cost, supplier, location, compatible_equipment, reorder_status } = req.body;
    const result = await pool.query(
      `UPDATE spare_parts SET name = COALESCE($1, name), part_number = COALESCE($2, part_number),
       category = COALESCE($3, category), quantity = COALESCE($4, quantity), min_quantity = COALESCE($5, min_quantity),
       unit_cost = COALESCE($6, unit_cost), supplier = COALESCE($7, supplier), location = COALESCE($8, location),
       compatible_equipment = COALESCE($9, compatible_equipment), reorder_status = COALESCE($10, reorder_status)
       WHERE id = $11 RETURNING *`,
      [name, part_number, category, quantity, min_quantity, unit_cost, supplier, location, compatible_equipment, reorder_status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Spare part updated successfully' });
  } catch (error) {
    console.error('Update spare part error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE spare part
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM spare_parts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Spare part deleted successfully' });
  } catch (error) {
    console.error('Delete spare part error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
