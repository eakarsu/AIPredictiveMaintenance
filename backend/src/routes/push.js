const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const {
  compactError,
  providerStatus,
  recordIntegrationEvent,
  sendPushNotification,
} = require('../services/integrationService');

router.get('/_/providers', (req, res) => {
  res.json({ success: true, data: providerStatus().push });
});

router.get('/subscriptions', async (req, res) => {
  const result = await pool.query(
    `SELECT ps.*, u.email, u.name
     FROM push_subscriptions ps
     LEFT JOIN users u ON u.id = ps.user_id
     ORDER BY ps.created_at DESC
     LIMIT 200`
  );
  res.json({ success: true, data: result.rows });
});

router.post('/subscriptions', async (req, res) => {
  try {
    const { provider, device_token, platform, enabled = true } = req.body || {};
    if (!provider || !device_token) return res.status(400).json({ success: false, message: 'provider and device_token are required' });
    if (!['onesignal', 'firebase'].includes(provider)) return res.status(400).json({ success: false, message: 'provider must be onesignal or firebase' });
    const userId = req.body?.user_id || req.user?.id || req.user?.userId;
    const result = await pool.query(
      `INSERT INTO push_subscriptions (user_id, provider, device_token, platform, enabled)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (provider, device_token)
       DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, enabled = EXCLUDED.enabled
       RETURNING *`,
      [userId || null, provider, device_token, platform || 'web', enabled]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: compactError(error) });
  }
});

router.post('/send', async (req, res) => {
  const { provider = 'onesignal', user_id, title, message, payload } = req.body || {};
  if (!title || !message) return res.status(400).json({ success: false, message: 'title and message are required' });
  try {
    const params = [provider];
    let where = 'provider = $1 AND enabled = TRUE';
    if (user_id) {
      params.push(user_id);
      where += ` AND user_id = $${params.length}`;
    }
    const tokens = await pool.query(`SELECT device_token, user_id FROM push_subscriptions WHERE ${where}`, params);
    const result = await sendPushNotification(provider, tokens.rows.map((row) => row.device_token), title, message, payload || {});
    const notification = await pool.query(
      `INSERT INTO push_notifications (provider, user_id, title, message, payload, status, response, sent_at)
       VALUES ($1,$2,$3,$4,$5,'sent',$6,NOW())
       RETURNING *`,
      [provider, user_id || null, title, message, JSON.stringify(payload || {}), JSON.stringify(result.response)]
    );
    await recordIntegrationEvent(pool, 'push', provider, 'send_notification', result.payload, result.response, 'sent', null);
    res.json({ success: true, data: notification.rows[0] });
  } catch (error) {
    await pool.query(
      `INSERT INTO push_notifications (provider, user_id, title, message, payload, status, error)
       VALUES ($1,$2,$3,$4,$5,'failed',$6)`,
      [provider, user_id || null, title || null, message || null, JSON.stringify(payload || {}), compactError(error)]
    ).catch(() => {});
    await recordIntegrationEvent(pool, 'push', provider, 'send_notification', { user_id, title }, error.response || {}, 'failed', compactError(error));
    res.status(error.status || 500).json({ success: false, message: compactError(error) });
  }
});

module.exports = router;
