const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET all reports
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT * FROM reports';
    const params = [];
    const conditions = [];

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, message: 'Reports retrieved successfully' });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET report by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Report retrieved successfully' });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create report
router.post('/', async (req, res) => {
  try {
    const { title, type, description, parameters, generated_by, file_url, status } = req.body;
    if (!title || !type) {
      return res.status(400).json({ success: false, message: 'title and type are required' });
    }
    const result = await pool.query(
      `INSERT INTO reports (title, type, description, parameters, generated_by, file_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, type, description || null, parameters ? JSON.stringify(parameters) : null, generated_by || null, file_url || null, status || 'pending']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Report created successfully' });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT update report
router.put('/:id', async (req, res) => {
  try {
    const { title, type, description, parameters, generated_by, file_url, status } = req.body;
    const result = await pool.query(
      `UPDATE reports SET title = COALESCE($1, title), type = COALESCE($2, type),
       description = COALESCE($3, description), parameters = COALESCE($4, parameters),
       generated_by = COALESCE($5, generated_by), file_url = COALESCE($6, file_url), status = COALESCE($7, status)
       WHERE id = $8 RETURNING *`,
      [title, type, description, parameters ? JSON.stringify(parameters) : null, generated_by, file_url, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Report updated successfully' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE report
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
