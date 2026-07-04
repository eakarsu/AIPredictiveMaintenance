const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const eventBus = require('../services/eventBus');
const { compactError, recordIntegrationEvent } = require('../services/integrationService');

let tableReady = false;
async function ensureDeviceTable() {
  if (tableReady) return;
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
}

function providerStatus() {
  const aws = !!(process.env.AWS_IOT_ENDPOINT && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  const azure = !!(process.env.AZURE_IOT_HUB_NAME && process.env.AZURE_IOT_HUB_KEY);
  const gcp = !!(process.env.GCP_IOT_PROJECT_ID && process.env.GCP_IOT_REGISTRY);
  return {
    aws_iot: aws,
    azure_iot: azure,
    gcp_iot: gcp,
    webhook_ingestion: true,
    available: aws || azure || gcp || true,
    missing: {
      aws_iot: ['AWS_IOT_ENDPOINT', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].filter((key) => !process.env[key]),
      azure_iot: ['AZURE_IOT_HUB_NAME', 'AZURE_IOT_HUB_KEY'].filter((key) => !process.env[key]),
      gcp_iot: ['GCP_IOT_PROJECT_ID', 'GCP_IOT_REGISTRY'].filter((key) => !process.env[key]),
      webhook_ingestion: ['IOT_WEBHOOK_SECRET'].filter((key) => !process.env[key]),
    },
  };
}

function assertWebhookSecret(req, res) {
  if (!process.env.IOT_WEBHOOK_SECRET) return true;
  if (req.headers['x-iot-secret'] === process.env.IOT_WEBHOOK_SECRET) return true;
  res.status(401).json({ success: false, message: 'Invalid IoT webhook secret' });
  return false;
}

function normalizeReadings(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.readings)) return body.readings;
  if (body?.value !== undefined) return [body];
  return [];
}

async function findSensor(reading) {
  if (reading.sensor_id) {
    const result = await pool.query('SELECT * FROM sensors WHERE id = $1', [reading.sensor_id]);
    return result.rows[0] || null;
  }
  if (reading.equipment_id && (reading.sensor_type || reading.type)) {
    const result = await pool.query(
      `SELECT * FROM sensors
       WHERE equipment_id = $1 AND LOWER(type) = LOWER($2)
       ORDER BY id
       LIMIT 1`,
      [reading.equipment_id, reading.sensor_type || reading.type]
    );
    return result.rows[0] || null;
  }
  return null;
}

function severityFor(sensor, value) {
  const min = sensor.min_threshold == null ? null : Number(sensor.min_threshold);
  const max = sensor.max_threshold == null ? null : Number(sensor.max_threshold);
  if (max != null && value > max) return value > max * 1.25 ? 'critical' : 'high';
  if (min != null && value < min) return value < min * 0.75 ? 'critical' : 'high';
  return null;
}

router.get('/_/providers', (req, res) => res.json({ success: true, data: providerStatus() }));

router.get('/devices', async (req, res) => {
  await ensureDeviceTable();
  const result = await pool.query('SELECT * FROM iot_devices ORDER BY created_at DESC LIMIT 200');
  res.json({ success: true, data: result.rows });
});

router.post('/devices/register', async (req, res) => {
  await ensureDeviceTable();
  try {
    const { provider = 'webhook', device_id, equipment_id, firmware, metadata } = req.body || {};
    if (!device_id) return res.status(400).json({ success: false, message: 'device_id is required' });
    const result = await pool.query(
      `INSERT INTO iot_devices (provider, device_id, equipment_id, firmware, status, metadata, last_seen)
       VALUES ($1,$2,$3,$4,'registered',$5,NOW())
       ON CONFLICT (provider, device_id)
       DO UPDATE SET equipment_id = EXCLUDED.equipment_id,
                     firmware = EXCLUDED.firmware,
                     metadata = EXCLUDED.metadata,
                     status = 'registered',
                     last_seen = NOW()
       RETURNING *`,
      [provider, device_id, equipment_id || null, firmware || null, JSON.stringify(metadata || {})]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: compactError(error) });
  }
});

router.post('/ingest/:provider', async (req, res) => {
  if (!assertWebhookSecret(req, res)) return;
  const provider = req.params.provider || 'webhook';
  const readings = normalizeReadings(req.body);
  if (!readings.length) return res.status(400).json({ success: false, message: 'At least one reading is required' });

  let accepted = 0;
  let rejected = 0;
  const qualityEvents = [];
  const anomalyEvents = [];

  try {
    const batch = await pool.query(
      `INSERT INTO sensor_ingestion_batches (source_system, batch_type, reading_count, accepted_count, rejected_count, status)
       VALUES ($1,$2,$3,0,0,'processing')
       RETURNING *`,
      [provider, readings.length === 1 ? 'stream' : 'batch', readings.length]
    );
    const batchId = batch.rows[0].id;

    for (const rawReading of readings) {
      const numericValue = Number(rawReading.value ?? rawReading.reading ?? rawReading.measurement);
      const sensor = await findSensor(rawReading);
      if (!sensor || Number.isNaN(numericValue)) {
        rejected += 1;
        const quality = await pool.query(
          `INSERT INTO sensor_quality_events (batch_id, sensor_id, quality_issue, severity, message)
           VALUES ($1,$2,$3,$4,$5)
           RETURNING *`,
          [
            batchId,
            sensor?.id || rawReading.sensor_id || null,
            sensor ? 'invalid_value' : 'unknown_sensor',
            'high',
            sensor ? 'Reading value could not be parsed as a number.' : 'No matching sensor was found for the inbound IoT reading.',
          ]
        );
        qualityEvents.push(quality.rows[0]);
        continue;
      }

      const timestamp = rawReading.timestamp || rawReading.recorded_at || new Date().toISOString();
      const severity = severityFor(sensor, numericValue);
      const reading = await pool.query(
        `INSERT INTO sensor_readings (sensor_id, value, timestamp, is_anomaly)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [sensor.id, numericValue, timestamp, !!severity]
      );
      accepted += 1;
      await pool.query(
        'UPDATE sensors SET last_reading = $1, last_reading_at = $2 WHERE id = $3',
        [numericValue, timestamp, sensor.id]
      );

      if (severity) {
        const summary = `${sensor.name} reported ${numericValue} ${sensor.unit || ''}, outside the configured operating band.`;
        const anomaly = await pool.query(
          `INSERT INTO anomaly_events (equipment_id, sensor_id, anomaly_type, severity, score, detected_at, status, summary)
           VALUES ($1,$2,$3,$4,$5,$6,'open',$7)
           RETURNING *`,
          [sensor.equipment_id, sensor.id, 'threshold_breach', severity, severity === 'critical' ? 95 : 82, timestamp, summary]
        );
        const anomalyEvent = anomaly.rows[0];
        await pool.query(
          `INSERT INTO anomaly_explanations (anomaly_event_id, explanation, evidence, confidence, recommended_action)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            anomalyEvent.id,
            'Inbound IoT reading exceeded the configured sensor threshold.',
            JSON.stringify({ reading: reading.rows[0], sensor_thresholds: { min: sensor.min_threshold, max: sensor.max_threshold } }),
            0.92,
            'Inspect the asset, confirm the reading with a second sample, and generate a work order if the condition persists.',
          ]
        );
        await pool.query(
          `INSERT INTO alerts (equipment_id, sensor_id, type, severity, message, status)
           VALUES ($1,$2,'sensor_threshold',$3,$4,'active')`,
          [sensor.equipment_id, sensor.id, severity, summary]
        );
        anomalyEvents.push(anomalyEvent);
        eventBus.emit('anomaly', { ...anomalyEvent, sensor_name: sensor.name, sensor_type: sensor.type, value: numericValue });
      }
    }

    const finalStatus = rejected === 0 ? 'completed' : accepted === 0 ? 'failed' : 'completed_with_errors';
    await pool.query(
      `UPDATE sensor_ingestion_batches
       SET accepted_count = $1, rejected_count = $2, status = $3
       WHERE id = $4`,
      [accepted, rejected, finalStatus, batchId]
    );
    await recordIntegrationEvent(
      pool,
      'iot',
      provider,
      'ingest_readings',
      { reading_count: readings.length },
      { batch_id: batchId, accepted, rejected, anomalies: anomalyEvents.length },
      finalStatus,
      null
    );

    res.json({
      success: true,
      data: {
        batch_id: batchId,
        accepted,
        rejected,
        quality_events: qualityEvents,
        anomaly_events: anomalyEvents,
      },
    });
  } catch (error) {
    await recordIntegrationEvent(pool, 'iot', provider, 'ingest_readings', { reading_count: readings.length }, {}, 'failed', compactError(error));
    res.status(500).json({ success: false, message: compactError(error) });
  }
});

router.delete('/devices/:id', async (req, res) => {
  await ensureDeviceTable();
  const result = await pool.query('DELETE FROM iot_devices WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Device not found' });
  res.json({ success: true, deleted: true });
});

module.exports = router;
