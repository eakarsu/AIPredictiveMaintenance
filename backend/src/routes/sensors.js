const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all sensors
router.get('/', async (req, res) => {
  try {
    const { equipment_id } = req.query;
    let query = 'SELECT s.*, e.name as equipment_name FROM sensors s LEFT JOIN equipment e ON s.equipment_id = e.id';
    const params = [];
    if (equipment_id) {
      query += ' WHERE s.equipment_id = $1';
      params.push(equipment_id);
    }
    query += ' ORDER BY s.id';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Sensors retrieved successfully' });
  } catch (error) {
    console.error('Get sensors error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET sensor by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT s.*, e.name as equipment_name FROM sensors s LEFT JOIN equipment e ON s.equipment_id = e.id WHERE s.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sensor not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Sensor retrieved successfully' });
  } catch (error) {
    console.error('Get sensor error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create sensor
router.post('/', async (req, res) => {
  try {
    const { equipment_id, name, type, unit, min_threshold, max_threshold, status } = req.body;
    if (!equipment_id || !name || !type) {
      return res.status(400).json({ success: false, message: 'equipment_id, name, and type are required' });
    }
    const result = await pool.query(
      `INSERT INTO sensors (equipment_id, name, type, unit, min_threshold, max_threshold, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [equipment_id, name, type, unit || null, min_threshold || null, max_threshold || null, status || 'active']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Sensor created successfully' });
  } catch (error) {
    console.error('Create sensor error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update sensor
router.put('/:id', async (req, res) => {
  try {
    const { equipment_id, name, type, unit, min_threshold, max_threshold, status, last_reading, last_reading_at } = req.body;
    const result = await pool.query(
      `UPDATE sensors SET equipment_id = COALESCE($1, equipment_id), name = COALESCE($2, name),
       type = COALESCE($3, type), unit = COALESCE($4, unit), min_threshold = COALESCE($5, min_threshold),
       max_threshold = COALESCE($6, max_threshold), status = COALESCE($7, status),
       last_reading = COALESCE($8, last_reading), last_reading_at = COALESCE($9, last_reading_at)
       WHERE id = $10 RETURNING *`,
      [equipment_id, name, type, unit, min_threshold, max_threshold, status, last_reading, last_reading_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sensor not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Sensor updated successfully' });
  } catch (error) {
    console.error('Update sensor error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE sensor
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sensors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sensor not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Sensor deleted successfully' });
  } catch (error) {
    console.error('Delete sensor error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
