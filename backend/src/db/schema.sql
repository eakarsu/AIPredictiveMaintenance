-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS cost_records CASCADE;
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

CREATE INDEX idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp);
CREATE INDEX idx_alerts_equipment_id ON alerts(equipment_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_work_orders_equipment_id ON work_orders(equipment_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_maintenance_logs_equipment_id ON maintenance_logs(equipment_id);
CREATE INDEX idx_cost_records_equipment_id ON cost_records(equipment_id);
