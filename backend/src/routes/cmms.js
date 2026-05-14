// Apply pass 5: CMMS integration backlog.
//
// Category: NEEDS-CREDS.
// Required env vars (per provider, only one provider needs to be set):
//   IBM Maximo:  MAXIMO_BASE_URL, MAXIMO_API_KEY  (or MAXIMO_USER + MAXIMO_PASSWORD)
//   SAP PM:      SAP_PM_BASE_URL, SAP_PM_API_KEY
//
// We do NOT make outbound HTTP from this stub. Instead, we expose:
//  - GET /api/cmms/_/providers        — provider availability + missing env list
//  - POST /api/cmms/sync/work-orders  — 503 if no creds; otherwise records a
//      `cmms_sync_log` entry (no actual sync — flagged for follow-up).
//  - POST /api/cmms/export/work-order/:id — export a local WO to a CMMS payload
//      shape; returns 503 if creds missing, else returns the payload that would
//      be POSTed (no network call).

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cmms_sync_log (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(40) NOT NULL,
        operation VARCHAR(40) NOT NULL,
        payload JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tableReady = true;
  } catch (e) { /* schema-tolerant */ }
}

function providerStatus() {
  const maximo = !!process.env.MAXIMO_BASE_URL && !!(process.env.MAXIMO_API_KEY || (process.env.MAXIMO_USER && process.env.MAXIMO_PASSWORD));
  const sap = !!process.env.SAP_PM_BASE_URL && !!process.env.SAP_PM_API_KEY;
  return {
    maximo,
    sap_pm: sap,
    available: maximo || sap,
    missing: {
      maximo: ['MAXIMO_BASE_URL', 'MAXIMO_API_KEY'].filter(k => !process.env[k]),
      sap_pm: ['SAP_PM_BASE_URL', 'SAP_PM_API_KEY'].filter(k => !process.env[k])
    }
  };
}

router.get('/_/providers', (req, res) => res.json({ success: true, data: providerStatus() }));

router.post('/sync/work-orders', async (req, res) => {
  await ensureTable();
  const status = providerStatus();
  if (!status.available) {
    return res.status(503).json({ success: false, error: 'No CMMS provider configured', missing: 'MAXIMO_BASE_URL or SAP_PM_BASE_URL' });
  }
  try {
    const provider = status.maximo ? 'maximo' : 'sap_pm';
    const r = await pool.query(
      "INSERT INTO cmms_sync_log (provider, operation, payload, status) VALUES ($1, 'sync_work_orders', $2, 'queued') RETURNING *",
      [provider, JSON.stringify({ note: 'Sync queued. Outbound HTTP deferred — wire your provider SDK to drain queued rows.' })]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/export/work-order/:id', async (req, res) => {
  const status = providerStatus();
  if (!status.available) {
    return res.status(503).json({ success: false, error: 'No CMMS provider configured', missing: 'MAXIMO_BASE_URL or SAP_PM_BASE_URL' });
  }
  try {
    const r = await pool.query('SELECT * FROM work_orders WHERE id = $1', [req.params.id]).catch(() => ({ rows: [] }));
    if (!r.rows.length) return res.status(404).json({ success: false, error: 'work order not found' });
    const wo = r.rows[0];
    // Provider-specific payload shapes. Real SDK call is intentionally NOT made.
    const provider = status.maximo ? 'maximo' : 'sap_pm';
    const payload = provider === 'maximo'
      ? {
          wonum: `LOCAL-${wo.id}`,
          description: wo.description || wo.title,
          worktype: wo.priority === 'critical' ? 'EM' : 'PM',
          status: wo.status === 'open' ? 'WSCH' : 'INPRG',
          asset_id: wo.equipment_id,
          targstartdate: wo.scheduled_date
        }
      : {
          OrderNumber: `LOCAL-${wo.id}`,
          ShortText: wo.description || wo.title,
          OrderType: 'PM01',
          SystemStatus: wo.status,
          FunctionalLocation: wo.equipment_id,
          BasicStartDate: wo.scheduled_date
        };
    res.json({ success: true, provider, payload, note: 'Returned payload only. Provider HTTP call deferred.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/sync-log', async (req, res) => {
  await ensureTable();
  try {
    const r = await pool.query('SELECT * FROM cmms_sync_log ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, data: r.rows });
  } catch (e) { res.json({ success: true, data: [] }); }
});

module.exports = router;
