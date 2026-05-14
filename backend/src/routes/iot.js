// Apply pass 5: IoT platform integration backlog.
//
// Category: NEEDS-CREDS.
// Required env vars (per cloud, only one needs to be set):
//   AWS IoT:      AWS_IOT_ENDPOINT, AWS_IOT_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
//   Azure IoT:    AZURE_IOT_HUB_NAME, AZURE_IOT_HUB_KEY
//   GCP IoT Core: GCP_IOT_PROJECT_ID, GCP_IOT_REGION, GCP_IOT_REGISTRY
//
// Endpoints (mounted under /api/iot, behind auth middleware in server.js):
//   GET  /api/iot/_/providers        — show which provider is configured
//   POST /api/iot/devices/register   — record a device shadow row (503 if no creds)
//   GET  /api/iot/devices            — list registered devices
//
// We do NOT pull in AWS / Azure / GCP SDKs. Real cloud-side device provisioning
// is a separate effort and intentionally out of scope. This stub gives the FE a
// stable interface for "list devices, link to equipment".

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS iot_devices (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(40) NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        equipment_id INT,
        firmware VARCHAR(80),
        status VARCHAR(40) DEFAULT 'pending',
        last_seen TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, device_id)
      )
    `);
    tableReady = true;
  } catch (e) { /* schema-tolerant */ }
}

function providerStatus() {
  const aws = !!(process.env.AWS_IOT_ENDPOINT && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  const azure = !!(process.env.AZURE_IOT_HUB_NAME && process.env.AZURE_IOT_HUB_KEY);
  const gcp = !!(process.env.GCP_IOT_PROJECT_ID && process.env.GCP_IOT_REGISTRY);
  return {
    aws_iot: aws,
    azure_iot: azure,
    gcp_iot: gcp,
    available: aws || azure || gcp,
    missing: {
      aws_iot: ['AWS_IOT_ENDPOINT', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].filter(k => !process.env[k]),
      azure_iot: ['AZURE_IOT_HUB_NAME', 'AZURE_IOT_HUB_KEY'].filter(k => !process.env[k]),
      gcp_iot: ['GCP_IOT_PROJECT_ID', 'GCP_IOT_REGISTRY'].filter(k => !process.env[k])
    }
  };
}

router.get('/_/providers', (req, res) => res.json({ success: true, data: providerStatus() }));

router.get('/devices', async (req, res) => {
  await ensureTable();
  try {
    const r = await pool.query('SELECT * FROM iot_devices ORDER BY created_at DESC LIMIT 200');
    res.json({ success: true, data: r.rows });
  } catch (e) { res.json({ success: true, data: [] }); }
});

router.post('/devices/register', async (req, res) => {
  await ensureTable();
  const status = providerStatus();
  if (!status.available) {
    return res.status(503).json({ success: false, error: 'No IoT provider configured', missing: 'AWS_IOT_ENDPOINT, AZURE_IOT_HUB_NAME, or GCP_IOT_PROJECT_ID' });
  }
  try {
    const { provider, device_id, equipment_id, firmware } = req.body;
    if (!provider || !device_id) return res.status(400).json({ success: false, error: 'provider and device_id required' });
    if (!['aws_iot', 'azure_iot', 'gcp_iot'].includes(provider)) {
      return res.status(400).json({ success: false, error: "provider must be aws_iot|azure_iot|gcp_iot" });
    }
    if (!status[provider]) return res.status(503).json({ success: false, error: `${provider} not configured`, missing: status.missing[provider].join(', ') });

    const r = await pool.query(
      `INSERT INTO iot_devices (provider, device_id, equipment_id, firmware, status)
       VALUES ($1,$2,$3,$4,'registered')
       ON CONFLICT (provider, device_id) DO UPDATE SET equipment_id = EXCLUDED.equipment_id, firmware = EXCLUDED.firmware
       RETURNING *`,
      [provider, device_id, equipment_id || null, firmware || null]
    );
    res.json({ success: true, data: r.rows[0], note: 'Device row recorded. Cloud-side provisioning requires SDK wiring (deferred).' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/devices/:id', async (req, res) => {
  await ensureTable();
  try {
    const r = await pool.query('DELETE FROM iot_devices WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: 'not found' });
    res.json({ success: true, deleted: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
