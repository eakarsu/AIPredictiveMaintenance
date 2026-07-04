const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const {
  compactError,
  providerStatus,
  recordIntegrationEvent,
  sendWorkOrderToCmms,
  workOrderToMaximoPayload,
  workOrderToSapPayload,
} = require('../services/integrationService');

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cmms_sync_log (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(40) NOT NULL,
      operation VARCHAR(40) NOT NULL,
      payload JSONB,
      status VARCHAR(40) DEFAULT 'pending',
      error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  tableReady = true;
}

function selectedProvider(requested) {
  const status = providerStatus().cmms;
  if (requested && ['maximo', 'sap_pm'].includes(requested)) return requested;
  if (status.maximo) return 'maximo';
  if (status.sap_pm) return 'sap_pm';
  return requested || 'unconfigured';
}

async function logSync(provider, operation, payload, status, error) {
  await ensureTable();
  const result = await pool.query(
    `INSERT INTO cmms_sync_log (provider, operation, payload, status, error)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [provider, operation, JSON.stringify(payload || {}), status, error || null]
  );
  return result.rows[0];
}

router.get('/_/providers', (req, res) => {
  res.json({ success: true, data: providerStatus().cmms });
});

router.post('/sync/work-orders', async (req, res) => {
  const status = providerStatus().cmms;
  if (!status.available) {
    return res.status(503).json({
      success: false,
      message: 'No CMMS provider configured',
      missing: status.missing,
    });
  }

  const provider = selectedProvider(req.body?.provider);
  if (!status[provider]) {
    return res.status(503).json({ success: false, message: `${provider} is not configured`, missing: status.missing[provider] });
  }

  try {
    const workOrders = await pool.query(
      `SELECT * FROM work_orders
       WHERE status IN ('open', 'in_progress', 'scheduled')
       ORDER BY created_at DESC
       LIMIT $1`,
      [Number(req.body?.limit) || 25]
    );

    const results = [];
    for (const workOrder of workOrders.rows) {
      try {
        const sent = await sendWorkOrderToCmms(workOrder, provider);
        await logSync(provider, 'sync_work_orders', sent.payload, 'sent', null);
        await recordIntegrationEvent(pool, 'cmms', provider, 'sync_work_orders', sent.payload, sent.response, 'sent', null);
        results.push({ work_order_id: workOrder.id, status: 'sent', response: sent.response });
      } catch (error) {
        const message = compactError(error);
        await logSync(provider, 'sync_work_orders', { work_order_id: workOrder.id }, 'failed', message);
        await recordIntegrationEvent(pool, 'cmms', provider, 'sync_work_orders', { work_order_id: workOrder.id }, error.response || {}, 'failed', message);
        results.push({ work_order_id: workOrder.id, status: 'failed', error: message });
      }
    }

    res.json({
      success: true,
      provider,
      count: results.length,
      sent: results.filter((item) => item.status === 'sent').length,
      failed: results.filter((item) => item.status === 'failed').length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: compactError(error) });
  }
});

router.post('/export/work-order/:id', async (req, res) => {
  const status = providerStatus().cmms;
  const provider = selectedProvider(req.body?.provider || req.query?.provider);

  try {
    const result = await pool.query('SELECT * FROM work_orders WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Work order not found' });
    const workOrder = result.rows[0];
    const payload = provider === 'sap_pm' ? workOrderToSapPayload(workOrder) : workOrderToMaximoPayload(workOrder);

    if (req.query.dry_run === 'true' || req.body?.dry_run === true) {
      return res.json({ success: true, provider, payload, dry_run: true });
    }

    if (!status.available || !status[provider]) {
      return res.status(503).json({
        success: false,
        message: `${provider} is not configured`,
        missing: status.missing[provider] || status.missing,
        payload,
      });
    }

    const sent = await sendWorkOrderToCmms(workOrder, provider);
    await logSync(provider, 'export_work_order', sent.payload, 'sent', null);
    await recordIntegrationEvent(pool, 'cmms', provider, 'export_work_order', sent.payload, sent.response, 'sent', null);
    res.json({ success: true, provider, payload: sent.payload, response: sent.response });
  } catch (error) {
    const message = compactError(error);
    await recordIntegrationEvent(pool, 'cmms', provider, 'export_work_order', { work_order_id: req.params.id }, error.response || {}, 'failed', message);
    res.status(error.status || 500).json({ success: false, message });
  }
});

router.get('/sync-log', async (req, res) => {
  await ensureTable();
  const result = await pool.query('SELECT * FROM cmms_sync_log ORDER BY created_at DESC LIMIT 100');
  res.json({ success: true, data: result.rows });
});

module.exports = router;
