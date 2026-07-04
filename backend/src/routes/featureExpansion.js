const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const features = {
  'asset-registry': {
    list: `
      SELECT ah.*, e.name AS equipment_name, e.type AS equipment_type, ac.criticality_score,
             ac.downtime_cost_per_hour, ac.risk_category, aw.warranty_provider, aw.end_date AS warranty_end_date
      FROM asset_hierarchy ah
      JOIN equipment e ON e.id = ah.equipment_id
      LEFT JOIN asset_criticality ac ON ac.equipment_id = e.id
      LEFT JOIN asset_warranty aw ON aw.equipment_id = e.id
      ORDER BY ac.criticality_score DESC NULLS LAST, e.name
    `,
    detail: `
      SELECT ah.*, e.name AS equipment_name, e.type AS equipment_type, e.health_score,
             ac.criticality_score, ac.downtime_cost_per_hour, ac.safety_impact, ac.production_impact,
             ac.risk_category, ac.review_notes, aw.warranty_provider, aw.contract_number,
             aw.start_date, aw.end_date, aw.coverage_details, aw.claim_status
      FROM asset_hierarchy ah
      JOIN equipment e ON e.id = ah.equipment_id
      LEFT JOIN asset_criticality ac ON ac.equipment_id = e.id
      LEFT JOIN asset_warranty aw ON aw.equipment_id = e.id
      WHERE ah.id = $1
    `,
  },
  'sensor-ingestion': {
    list: `
      SELECT b.*, COUNT(q.id)::int AS quality_event_count
      FROM sensor_ingestion_batches b
      LEFT JOIN sensor_quality_events q ON q.batch_id = b.id
      GROUP BY b.id
      ORDER BY b.started_at DESC
    `,
    detail: 'SELECT * FROM sensor_ingestion_batches WHERE id = $1',
    children: [{ key: 'quality_events', query: 'SELECT q.*, s.name AS sensor_name FROM sensor_quality_events q LEFT JOIN sensors s ON s.id = q.sensor_id WHERE q.batch_id = $1 ORDER BY q.created_at DESC' }],
  },
  'anomaly-events': {
    list: `
      SELECT ae.*, e.name AS equipment_name, s.name AS sensor_name
      FROM anomaly_events ae
      JOIN equipment e ON e.id = ae.equipment_id
      LEFT JOIN sensors s ON s.id = ae.sensor_id
      ORDER BY ae.score DESC, ae.detected_at DESC
    `,
    detail: `
      SELECT ae.*, e.name AS equipment_name, s.name AS sensor_name
      FROM anomaly_events ae
      JOIN equipment e ON e.id = ae.equipment_id
      LEFT JOIN sensors s ON s.id = ae.sensor_id
      WHERE ae.id = $1
    `,
    children: [{ key: 'explanations', query: 'SELECT * FROM anomaly_explanations WHERE anomaly_event_id = $1 ORDER BY confidence DESC' }],
  },
  'predictive-scheduling': {
    list: `
      SELECT psr.*, e.name AS equipment_name, e.health_score, COUNT(mwc.id)::int AS constraint_count
      FROM predictive_schedule_recommendations psr
      JOIN equipment e ON e.id = psr.equipment_id
      LEFT JOIN maintenance_window_constraints mwc ON mwc.recommendation_id = psr.id
      GROUP BY psr.id, e.name, e.health_score
      ORDER BY psr.failure_probability DESC, psr.recommended_window_start
    `,
    detail: 'SELECT psr.*, e.name AS equipment_name, e.health_score FROM predictive_schedule_recommendations psr JOIN equipment e ON e.id = psr.equipment_id WHERE psr.id = $1',
    children: [{ key: 'constraints', query: 'SELECT * FROM maintenance_window_constraints WHERE recommendation_id = $1 ORDER BY id' }],
  },
  'generated-work-orders': {
    list: `
      SELECT gwo.*, e.name AS equipment_name, a.message AS alert_message, wo.title AS work_order_title, COUNT(woc.id)::int AS checklist_count
      FROM generated_work_orders gwo
      JOIN equipment e ON e.id = gwo.equipment_id
      LEFT JOIN alerts a ON a.id = gwo.source_alert_id
      LEFT JOIN work_orders wo ON wo.id = gwo.work_order_id
      LEFT JOIN work_order_checklists woc ON woc.generated_work_order_id = gwo.id
      GROUP BY gwo.id, e.name, a.message, wo.title
      ORDER BY gwo.created_at DESC
    `,
    detail: `
      SELECT gwo.*, e.name AS equipment_name, a.message AS alert_message, wo.title AS work_order_title
      FROM generated_work_orders gwo
      JOIN equipment e ON e.id = gwo.equipment_id
      LEFT JOIN alerts a ON a.id = gwo.source_alert_id
      LEFT JOIN work_orders wo ON wo.id = gwo.work_order_id
      WHERE gwo.id = $1
    `,
    children: [{ key: 'checklist', query: 'SELECT * FROM work_order_checklists WHERE generated_work_order_id = $1 ORDER BY step_number' }],
  },
  'parts-forecasting': {
    list: `
      SELECT pf.*, sp.name AS part_name, sp.part_number, sp.quantity AS current_quantity,
             prr.recommended_quantity, prr.urgency, prr.estimated_cost, prr.status AS recommendation_status
      FROM parts_forecasts pf
      JOIN spare_parts sp ON sp.id = pf.spare_part_id
      LEFT JOIN parts_reorder_recommendations prr ON prr.forecast_id = pf.id
      ORDER BY CASE pf.stockout_risk WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, sp.name
    `,
    detail: `
      SELECT pf.*, sp.name AS part_name, sp.part_number, sp.quantity AS current_quantity, sp.min_quantity,
             sp.unit_cost, sp.supplier, prr.recommended_quantity, prr.reorder_point, prr.urgency,
             prr.estimated_cost, prr.rationale, prr.status AS recommendation_status
      FROM parts_forecasts pf
      JOIN spare_parts sp ON sp.id = pf.spare_part_id
      LEFT JOIN parts_reorder_recommendations prr ON prr.forecast_id = pf.id
      WHERE pf.id = $1
    `,
  },
  'downtime-roi': {
    list: `
      SELECT dcm.*, mrm.maintenance_spend, mrm.recorded_costs, mrm.open_failures, mrm.estimated_avoided_loss
      FROM downtime_cost_metrics dcm
      LEFT JOIN maintenance_roi_metrics mrm ON mrm.equipment_id = dcm.equipment_id
      ORDER BY dcm.cost_exposure DESC
    `,
    detail: `
      SELECT dcm.*, mrm.maintenance_spend, mrm.recorded_costs, mrm.open_failures, mrm.estimated_avoided_loss
      FROM downtime_cost_metrics dcm
      LEFT JOIN maintenance_roi_metrics mrm ON mrm.equipment_id = dcm.equipment_id
      WHERE dcm.equipment_id = $1
    `,
    idField: 'equipment_id',
  },
  'technician-checklists': {
    list: `
      SELECT tc.*, wo.title AS work_order_title, e.name AS equipment_name, COUNT(tci.id)::int AS item_count, COUNT(fu.id)::int AS upload_count
      FROM technician_checklists tc
      JOIN work_orders wo ON wo.id = tc.work_order_id
      JOIN equipment e ON e.id = wo.equipment_id
      LEFT JOIN technician_checklist_items tci ON tci.checklist_id = tc.id
      LEFT JOIN field_uploads fu ON fu.checklist_id = tc.id
      GROUP BY tc.id, wo.title, e.name
      ORDER BY tc.created_at DESC
    `,
    detail: `
      SELECT tc.*, wo.title AS work_order_title, e.name AS equipment_name
      FROM technician_checklists tc
      JOIN work_orders wo ON wo.id = tc.work_order_id
      JOIN equipment e ON e.id = wo.equipment_id
      WHERE tc.id = $1
    `,
    children: [
      { key: 'items', query: 'SELECT * FROM technician_checklist_items WHERE checklist_id = $1 ORDER BY step_number' },
      { key: 'field_uploads', query: 'SELECT * FROM field_uploads WHERE checklist_id = $1 ORDER BY uploaded_at DESC' },
    ],
  },
};

router.get('/:feature', async (req, res) => {
  const config = features[req.params.feature];
  if (!config) return res.status(404).json({ success: false, message: 'Feature not found' });

  try {
    const result = await pool.query(config.list);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Feature expansion list error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:feature/:id', async (req, res) => {
  const config = features[req.params.feature];
  if (!config) return res.status(404).json({ success: false, message: 'Feature not found' });

  try {
    const result = await pool.query(config.detail, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });

    const children = {};
    for (const child of config.children || []) {
      const childResult = await pool.query(child.query, [req.params.id]);
      children[child.key] = childResult.rows;
    }

    res.json({ success: true, data: { ...result.rows[0], children } });
  } catch (error) {
    console.error('Feature expansion detail error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
