-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS cost_records CASCADE;
DROP VIEW IF EXISTS maintenance_roi_metrics CASCADE;
DROP VIEW IF EXISTS downtime_cost_metrics CASCADE;
DROP TABLE IF EXISTS field_uploads CASCADE;
DROP TABLE IF EXISTS push_notifications CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS procurement_orders CASCADE;
DROP TABLE IF EXISTS integration_events CASCADE;
DROP TABLE IF EXISTS technician_checklist_items CASCADE;
DROP TABLE IF EXISTS technician_checklists CASCADE;
DROP TABLE IF EXISTS parts_reorder_recommendations CASCADE;
DROP TABLE IF EXISTS parts_forecasts CASCADE;
DROP TABLE IF EXISTS work_order_checklists CASCADE;
DROP TABLE IF EXISTS generated_work_orders CASCADE;
DROP TABLE IF EXISTS maintenance_window_constraints CASCADE;
DROP TABLE IF EXISTS predictive_schedule_recommendations CASCADE;
DROP TABLE IF EXISTS anomaly_explanations CASCADE;
DROP TABLE IF EXISTS anomaly_events CASCADE;
DROP TABLE IF EXISTS sensor_quality_events CASCADE;
DROP TABLE IF EXISTS sensor_ingestion_batches CASCADE;
DROP TABLE IF EXISTS asset_warranty CASCADE;
DROP TABLE IF EXISTS asset_criticality CASCADE;
DROP TABLE IF EXISTS asset_hierarchy CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS spare_parts CASCADE;
DROP TABLE IF EXISTS failure_analysis CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS maintenance_schedules CASCADE;
DROP TABLE IF EXISTS sensor_readings CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'operational',
  manufacturer VARCHAR(255),
  model_number VARCHAR(100),
  install_date DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  health_score NUMERIC(5,2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sensors (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  unit VARCHAR(50),
  min_threshold NUMERIC(10,2),
  max_threshold NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'active',
  last_reading NUMERIC(10,2),
  last_reading_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sensor_readings (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
  value NUMERIC(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_anomaly BOOLEAN DEFAULT FALSE
);

CREATE TABLE maintenance_schedules (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(50) NOT NULL,
  frequency VARCHAR(50),
  next_due DATE,
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  sensor_id INTEGER REFERENCES sensors(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to VARCHAR(255),
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  cost NUMERIC(10,2),
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE failure_analysis (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  failure_date DATE NOT NULL,
  failure_type VARCHAR(100) NOT NULL,
  root_cause TEXT,
  impact TEXT,
  corrective_action TEXT,
  prevention_plan TEXT,
  ai_analysis TEXT,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spare_parts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  unit_cost NUMERIC(10,2),
  supplier VARCHAR(255),
  location VARCHAR(255),
  compatible_equipment TEXT,
  reorder_status VARCHAR(50) DEFAULT 'in_stock',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE maintenance_logs (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  performed_by VARCHAR(255),
  duration_hours NUMERIC(6,2),
  cost NUMERIC(10,2),
  parts_used TEXT,
  notes TEXT,
  performed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cost_records (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  budget_category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  parameters JSONB,
  generated_by VARCHAR(255),
  file_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE asset_hierarchy (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  parent_equipment_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
  site VARCHAR(255),
  area VARCHAR(255),
  production_line VARCHAR(255),
  asset_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE asset_criticality (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  criticality_score INTEGER NOT NULL,
  downtime_cost_per_hour NUMERIC(12,2),
  safety_impact VARCHAR(50),
  production_impact VARCHAR(50),
  risk_category VARCHAR(50),
  review_notes TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE asset_warranty (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  warranty_provider VARCHAR(255),
  contract_number VARCHAR(100),
  start_date DATE,
  end_date DATE,
  coverage_details TEXT,
  claim_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sensor_ingestion_batches (
  id SERIAL PRIMARY KEY,
  source_system VARCHAR(100),
  batch_type VARCHAR(50),
  reading_count INTEGER,
  accepted_count INTEGER,
  rejected_count INTEGER,
  status VARCHAR(50) DEFAULT 'processed',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE sensor_quality_events (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES sensor_ingestion_batches(id) ON DELETE CASCADE,
  sensor_id INTEGER REFERENCES sensors(id) ON DELETE SET NULL,
  event_type VARCHAR(100),
  severity VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE anomaly_events (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  sensor_id INTEGER REFERENCES sensors(id) ON DELETE SET NULL,
  anomaly_type VARCHAR(100),
  severity VARCHAR(50),
  score NUMERIC(6,2),
  detected_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'open',
  summary TEXT
);

CREATE TABLE anomaly_explanations (
  id SERIAL PRIMARY KEY,
  anomaly_event_id INTEGER REFERENCES anomaly_events(id) ON DELETE CASCADE,
  explanation TEXT,
  evidence TEXT,
  confidence NUMERIC(5,2),
  recommended_action TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE predictive_schedule_recommendations (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  recommended_window_start TIMESTAMP,
  recommended_window_end TIMESTAMP,
  failure_probability NUMERIC(5,2),
  priority VARCHAR(50),
  labor_hours NUMERIC(6,2),
  required_parts TEXT,
  recommendation TEXT,
  status VARCHAR(50) DEFAULT 'proposed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE maintenance_window_constraints (
  id SERIAL PRIMARY KEY,
  recommendation_id INTEGER REFERENCES predictive_schedule_recommendations(id) ON DELETE CASCADE,
  constraint_type VARCHAR(100),
  description TEXT,
  severity VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE generated_work_orders (
  id SERIAL PRIMARY KEY,
  source_alert_id INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
  recommendation_id INTEGER REFERENCES predictive_schedule_recommendations(id) ON DELETE SET NULL,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  generation_reason TEXT,
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  parts_context TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE work_order_checklists (
  id SERIAL PRIMARY KEY,
  generated_work_order_id INTEGER REFERENCES generated_work_orders(id) ON DELETE CASCADE,
  step_number INTEGER,
  checklist_item TEXT,
  required BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'pending',
  completed_by VARCHAR(255),
  completed_at TIMESTAMP
);

CREATE TABLE parts_forecasts (
  id SERIAL PRIMARY KEY,
  spare_part_id INTEGER REFERENCES spare_parts(id) ON DELETE CASCADE,
  forecast_period VARCHAR(50),
  forecast_quantity INTEGER,
  confidence NUMERIC(5,2),
  stockout_risk VARCHAR(50),
  vendor_lead_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE parts_reorder_recommendations (
  id SERIAL PRIMARY KEY,
  forecast_id INTEGER REFERENCES parts_forecasts(id) ON DELETE CASCADE,
  recommended_quantity INTEGER,
  reorder_point INTEGER,
  urgency VARCHAR(50),
  estimated_cost NUMERIC(12,2),
  rationale TEXT,
  status VARCHAR(50) DEFAULT 'recommended',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE technician_checklists (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  technician VARCHAR(255),
  mobile_status VARCHAR(50) DEFAULT 'assigned',
  offline_sync_status VARCHAR(50) DEFAULT 'synced',
  signature_name VARCHAR(255),
  signed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE technician_checklist_items (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER REFERENCES technician_checklists(id) ON DELETE CASCADE,
  step_number INTEGER,
  task TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  photo_required BOOLEAN DEFAULT FALSE,
  notes TEXT,
  completed_at TIMESTAMP
);

CREATE TABLE field_uploads (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER REFERENCES technician_checklists(id) ON DELETE CASCADE,
  upload_type VARCHAR(50),
  file_url VARCHAR(500),
  caption TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE integration_events (
  id SERIAL PRIMARY KEY,
  integration_type VARCHAR(80) NOT NULL,
  provider VARCHAR(80),
  operation VARCHAR(120),
  request_payload JSONB,
  response_payload JSONB,
  status VARCHAR(40) DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE procurement_orders (
  id SERIAL PRIMARY KEY,
  recommendation_id INTEGER REFERENCES parts_reorder_recommendations(id) ON DELETE SET NULL,
  spare_part_id INTEGER REFERENCES spare_parts(id) ON DELETE SET NULL,
  supplier VARCHAR(255),
  quantity INTEGER NOT NULL,
  estimated_cost NUMERIC(12,2),
  status VARCHAR(50) DEFAULT 'draft',
  external_order_id VARCHAR(255),
  dispatch_response JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  dispatched_at TIMESTAMP
);

CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  device_token TEXT NOT NULL,
  platform VARCHAR(50),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, device_token)
);

CREATE TABLE push_notifications (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255),
  message TEXT,
  payload JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  response JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);

CREATE VIEW downtime_cost_metrics AS
SELECT
  e.id AS equipment_id,
  e.name AS equipment_name,
  e.status,
  e.health_score,
  COALESCE(ac.criticality_score, 50) AS criticality_score,
  COALESCE(ac.downtime_cost_per_hour, 0) AS downtime_cost_per_hour,
  COUNT(wo.id) FILTER (WHERE wo.status IN ('open', 'in_progress', 'scheduled')) AS open_work_orders,
  COUNT(a.id) FILTER (WHERE a.status = 'active') AS active_alerts,
  ROUND((100 - COALESCE(e.health_score, 100)) * COALESCE(ac.downtime_cost_per_hour, 0) / 10, 2) AS cost_exposure
FROM equipment e
LEFT JOIN asset_criticality ac ON ac.equipment_id = e.id
LEFT JOIN work_orders wo ON wo.equipment_id = e.id
LEFT JOIN alerts a ON a.equipment_id = e.id
GROUP BY e.id, e.name, e.status, e.health_score, ac.criticality_score, ac.downtime_cost_per_hour;

CREATE VIEW maintenance_roi_metrics AS
SELECT
  e.id AS equipment_id,
  e.name AS equipment_name,
  COALESCE(SUM(ml.cost), 0) AS maintenance_spend,
  COALESCE(SUM(cr.amount), 0) AS recorded_costs,
  COALESCE(MAX(ac.downtime_cost_per_hour), 0) AS downtime_cost_per_hour,
  COUNT(fa.id) FILTER (WHERE fa.status <> 'closed') AS open_failures,
  ROUND((COALESCE(MAX(ac.downtime_cost_per_hour), 0) * 8) - COALESCE(SUM(ml.cost), 0), 2) AS estimated_avoided_loss
FROM equipment e
LEFT JOIN maintenance_logs ml ON ml.equipment_id = e.id
LEFT JOIN cost_records cr ON cr.equipment_id = e.id
LEFT JOIN asset_criticality ac ON ac.equipment_id = e.id
LEFT JOIN failure_analysis fa ON fa.equipment_id = e.id
GROUP BY e.id, e.name;

CREATE INDEX idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX idx_alerts_equipment_id ON alerts(equipment_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_work_orders_equipment_id ON work_orders(equipment_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_maintenance_logs_equipment_id ON maintenance_logs(equipment_id);
CREATE INDEX idx_cost_records_equipment_id ON cost_records(equipment_id);
