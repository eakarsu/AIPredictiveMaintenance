const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const {
  compactError,
  dispatchProcurementOrder,
  providerStatus,
  recordIntegrationEvent,
} = require('../services/integrationService');

router.get('/_/providers', (req, res) => {
  res.json({ success: true, data: providerStatus().procurement });
});

router.get('/orders', async (req, res) => {
  const result = await pool.query(
    `SELECT po.*, sp.name AS part_name, sp.part_number
     FROM procurement_orders po
     LEFT JOIN spare_parts sp ON sp.id = po.spare_part_id
     ORDER BY po.created_at DESC
     LIMIT 200`
  );
  res.json({ success: true, data: result.rows });
});

router.post('/orders/from-recommendation/:id', async (req, res) => {
  try {
    const recommendation = await pool.query(
      `SELECT prr.*, pf.spare_part_id, sp.supplier, sp.unit_cost
       FROM parts_reorder_recommendations prr
       JOIN parts_forecasts pf ON pf.id = prr.forecast_id
       JOIN spare_parts sp ON sp.id = pf.spare_part_id
       WHERE prr.id = $1`,
      [req.params.id]
    );
    if (!recommendation.rows.length) return res.status(404).json({ success: false, message: 'Recommendation not found' });
    const row = recommendation.rows[0];
    const result = await pool.query(
      `INSERT INTO procurement_orders (recommendation_id, spare_part_id, supplier, quantity, estimated_cost, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        row.id,
        row.spare_part_id,
        req.body?.supplier || row.supplier,
        Number(req.body?.quantity) || row.recommended_quantity,
        req.body?.estimated_cost || row.estimated_cost || (Number(row.unit_cost || 0) * Number(row.recommended_quantity || 0)),
        req.body?.status || 'draft',
        req.user?.email || req.user?.username || req.user?.id || 'system',
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: compactError(error) });
  }
});

router.post('/orders/:id/dispatch', async (req, res) => {
  try {
    const orderResult = await pool.query('SELECT * FROM procurement_orders WHERE id = $1', [req.params.id]);
    if (!orderResult.rows.length) return res.status(404).json({ success: false, message: 'Procurement order not found' });
    const order = orderResult.rows[0];
    const dispatched = await dispatchProcurementOrder(order);
    const updated = await pool.query(
      `UPDATE procurement_orders
       SET status = 'dispatched',
           external_order_id = $1,
           dispatch_response = $2,
           dispatched_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [dispatched.externalOrderId, JSON.stringify(dispatched.response), order.id]
    );
    await recordIntegrationEvent(pool, 'procurement', dispatched.provider, 'dispatch_order', dispatched.payload, dispatched.response, 'sent', null);
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    await recordIntegrationEvent(pool, 'procurement', 'generic_http', 'dispatch_order', { order_id: req.params.id }, error.response || {}, 'failed', compactError(error));
    res.status(error.status || 500).json({ success: false, message: compactError(error) });
  }
});

module.exports = router;
