// Apply pass 5: OEE (Overall Equipment Effectiveness) tracking.
//
// Category: NEEDS-PRODUCT-DECISION (data model + calculation).
// PRODUCT-DECISION:
//   - Schema: store *daily* shift-level OEE inputs (not raw event-level).
//     Columns: planned_production_time_min, run_time_min, total_units, good_units,
//     ideal_cycle_time_sec.  Computed columns derived in SELECT, not stored,
//     so the formula can be tweaked without a migration.
//   - Formulas (industry-standard SEMI E10):
//        availability = run_time / planned_production_time
//        performance  = (ideal_cycle_time * total_units) / run_time
//        quality      = good_units / total_units
//        oee          = availability * performance * quality
//   - Rejected: event-stream-based OEE. That requires an aggregator + windowing
//     pipeline; left in the TOO-RISKY backlog (real-time anomaly streaming).
//
// Endpoints (mounted under /api/oee, behind auth):
//   GET    /api/oee                        — list (filter by equipment_id, date range)
//   POST   /api/oee                        — create a shift entry
//   GET    /api/oee/:id
//   PUT    /api/oee/:id
//   DELETE /api/oee/:id
//   GET    /api/oee/_/summary?equipment_id — rolling 7/30 day OEE

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oee_records (
        id SERIAL PRIMARY KEY,
        equipment_id INT NOT NULL,
        shift_date DATE NOT NULL,
        shift_label VARCHAR(40),
        planned_production_time_min NUMERIC(10,2) NOT NULL,
        run_time_min NUMERIC(10,2) NOT NULL,
        total_units INT NOT NULL,
        good_units INT NOT NULL,
        ideal_cycle_time_sec NUMERIC(10,4) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_oee_equipment_date ON oee_records (equipment_id, shift_date DESC)`);
    tableReady = true;
  } catch (e) { /* schema-tolerant */ }
}

function computeOee(r) {
  const planned = Number(r.planned_production_time_min) || 0;
  const run = Number(r.run_time_min) || 0;
  const total = Number(r.total_units) || 0;
  const good = Number(r.good_units) || 0;
  const ict = Number(r.ideal_cycle_time_sec) || 0;
  const availability = planned > 0 ? run / planned : 0;
  const performance = run > 0 ? (ict * total) / (run * 60) : 0;
  const quality = total > 0 ? good / total : 0;
  const oee = availability * performance * quality;
  return {
    availability: +availability.toFixed(4),
    performance: +performance.toFixed(4),
    quality: +quality.toFixed(4),
    oee: +oee.toFixed(4)
  };
}

router.get('/', async (req, res) => {
  await ensureTable();
  try {
    const { equipment_id, from, to } = req.query;
    const conds = [];
    const params = [];
    if (equipment_id) { params.push(equipment_id); conds.push(`equipment_id = $${params.length}`); }
    if (from) { params.push(from); conds.push(`shift_date >= $${params.length}`); }
    if (to) { params.push(to); conds.push(`shift_date <= $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const r = await pool.query(`SELECT * FROM oee_records ${where} ORDER BY shift_date DESC, id DESC LIMIT 200`, params);
    res.json({ success: true, data: r.rows.map(row => ({ ...row, ...computeOee(row) })) });
  } catch (e) { res.json({ success: true, data: [] }); }
});

router.post('/', async (req, res) => {
  await ensureTable();
  try {
    const { equipment_id, shift_date, shift_label, planned_production_time_min, run_time_min, total_units, good_units, ideal_cycle_time_sec, notes } = req.body;
    if (!equipment_id || !shift_date || planned_production_time_min == null || run_time_min == null || total_units == null || good_units == null || ideal_cycle_time_sec == null) {
      return res.status(400).json({ success: false, error: 'equipment_id, shift_date, planned_production_time_min, run_time_min, total_units, good_units, ideal_cycle_time_sec are required' });
    }
    const r = await pool.query(
      `INSERT INTO oee_records (equipment_id, shift_date, shift_label, planned_production_time_min, run_time_min, total_units, good_units, ideal_cycle_time_sec, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [equipment_id, shift_date, shift_label || null, planned_production_time_min, run_time_min, total_units, good_units, ideal_cycle_time_sec, notes || null]
    );
    const row = r.rows[0];
    res.status(201).json({ success: true, data: { ...row, ...computeOee(row) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/_/summary', async (req, res) => {
  await ensureTable();
  try {
    const { equipment_id, days } = req.query;
    const lookback = Math.max(1, Math.min(365, parseInt(days) || 30));
    const params = [lookback];
    let where = `shift_date >= CURRENT_DATE - $1::int`;
    if (equipment_id) { params.push(equipment_id); where += ` AND equipment_id = $${params.length}`; }
    const r = await pool.query(`SELECT * FROM oee_records WHERE ${where}`, params);
    if (!r.rows.length) return res.json({ success: true, data: { records: 0 } });
    const tot = r.rows.reduce((acc, x) => {
      const c = computeOee(x);
      acc.availability += c.availability;
      acc.performance += c.performance;
      acc.quality += c.quality;
      acc.oee += c.oee;
      return acc;
    }, { availability: 0, performance: 0, quality: 0, oee: 0 });
    const n = r.rows.length;
    res.json({
      success: true,
      data: {
        records: n,
        days: lookback,
        avg_availability: +(tot.availability / n).toFixed(4),
        avg_performance: +(tot.performance / n).toFixed(4),
        avg_quality: +(tot.quality / n).toFixed(4),
        avg_oee: +(tot.oee / n).toFixed(4)
      }
    });
  } catch (e) { res.json({ success: true, data: { records: 0 } }); }
});

router.get('/:id', async (req, res) => {
  await ensureTable();
  try {
    const r = await pool.query('SELECT * FROM oee_records WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: 'not found' });
    const row = r.rows[0];
    res.json({ success: true, data: { ...row, ...computeOee(row) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id', async (req, res) => {
  await ensureTable();
  try {
    const { shift_label, planned_production_time_min, run_time_min, total_units, good_units, ideal_cycle_time_sec, notes } = req.body;
    const r = await pool.query(
      `UPDATE oee_records SET
         shift_label = COALESCE($2, shift_label),
         planned_production_time_min = COALESCE($3, planned_production_time_min),
         run_time_min = COALESCE($4, run_time_min),
         total_units = COALESCE($5, total_units),
         good_units = COALESCE($6, good_units),
         ideal_cycle_time_sec = COALESCE($7, ideal_cycle_time_sec),
         notes = COALESCE($8, notes)
       WHERE id = $1 RETURNING *`,
      [req.params.id, shift_label, planned_production_time_min, run_time_min, total_units, good_units, ideal_cycle_time_sec, notes]
    );
    if (!r.rows.length) return res.status(404).json({ success: false, error: 'not found' });
    const row = r.rows[0];
    res.json({ success: true, data: { ...row, ...computeOee(row) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  await ensureTable();
  try {
    const r = await pool.query('DELETE FROM oee_records WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: 'not found' });
    res.json({ success: true, deleted: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
