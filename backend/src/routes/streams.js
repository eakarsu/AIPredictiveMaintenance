const express = require('express');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/security');
const router = express.Router();
const pool = require('../db/pool');
const eventBus = require('../services/eventBus');

function verifyStreamToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = req.query.token || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    req.user = jwt.verify(token, jwtSecret());
    next();
  } catch (_) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

router.get('/anomalies/recent', verifyStreamToken, async (req, res) => {
  const result = await pool.query(
    `SELECT ae.*, e.name AS equipment_name, s.name AS sensor_name, s.type AS sensor_type
     FROM anomaly_events ae
     LEFT JOIN equipment e ON e.id = ae.equipment_id
     LEFT JOIN sensors s ON s.id = ae.sensor_id
     ORDER BY ae.detected_at DESC
     LIMIT 50`
  );
  res.json({ success: true, data: result.rows });
});

router.get('/anomalies', verifyStreamToken, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const recent = await pool.query(
    `SELECT ae.*, e.name AS equipment_name, s.name AS sensor_name, s.type AS sensor_type
     FROM anomaly_events ae
     LEFT JOIN equipment e ON e.id = ae.equipment_id
     LEFT JOIN sensors s ON s.id = ae.sensor_id
     ORDER BY ae.detected_at DESC
     LIMIT 10`
  );
  send('snapshot', recent.rows);

  const heartbeat = setInterval(() => send('heartbeat', { timestamp: new Date().toISOString() }), 25000);
  const handler = (event) => send('anomaly', event);
  eventBus.on('anomaly', handler);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.off('anomaly', handler);
    res.end();
  });
});

module.exports = router;
