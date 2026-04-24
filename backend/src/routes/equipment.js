const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all equipment
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY id');
    res.json({ success: true, data: result.rows, message: 'Equipment retrieved successfully' });
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET equipment by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Equipment retrieved successfully' });
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create equipment
router.post('/', async (req, res) => {
  try {
    const { name, type, location, status, manufacturer, model_number, install_date, last_maintenance, next_maintenance, health_score } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }
    const result = await pool.query(
      `INSERT INTO equipment (name, type, location, status, manufacturer, model_number, install_date, last_maintenance, next_maintenance, health_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, type, location || null, status || 'operational', manufacturer || null, model_number || null, install_date || null, last_maintenance || null, next_maintenance || null, health_score || 100.00]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Equipment created successfully' });
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update equipment
router.put('/:id', async (req, res) => {
  try {
    const { name, type, location, status, manufacturer, model_number, install_date, last_maintenance, next_maintenance, health_score } = req.body;
    const result = await pool.query(
      `UPDATE equipment SET name = COALESCE($1, name), type = COALESCE($2, type), location = COALESCE($3, location),
       status = COALESCE($4, status), manufacturer = COALESCE($5, manufacturer), model_number = COALESCE($6, model_number),
       install_date = COALESCE($7, install_date), last_maintenance = COALESCE($8, last_maintenance),
       next_maintenance = COALESCE($9, next_maintenance), health_score = COALESCE($10, health_score)
       WHERE id = $11 RETURNING *`,
      [name, type, location, status, manufacturer, model_number, install_date, last_maintenance, next_maintenance, health_score, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Equipment updated successfully' });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE equipment
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equipment WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
