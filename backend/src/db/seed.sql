-- Seed Users (password is 'password123' for all users)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'James Carter', 'admin'),
('manager@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Sarah Mitchell', 'manager'),
('tech1@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Mike Johnson', 'technician'),
('tech2@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Emily Chen', 'technician'),
('tech3@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'David Park', 'technician'),
('engineer1@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Lisa Wang', 'engineer'),
('engineer2@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Robert Garcia', 'engineer'),
('supervisor@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Angela Brooks', 'supervisor'),
('analyst@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Tom Wilson', 'analyst'),
('operator1@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Nancy Davis', 'operator'),
('operator2@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Carlos Hernandez', 'operator'),
('maintenance@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Kevin Brown', 'maintenance_lead'),
('safety@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Jennifer Lee', 'safety_officer'),
('planner@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Daniel Taylor', 'planner'),
('director@factory.com', '$2a$10$zLO.8O4r3Ai4iYnV1MVaH.TSg2ZoRS4on4jPS4KP9kpnIv.uj4142', 'Patricia Anderson', 'director');

-- Seed Equipment
INSERT INTO equipment (name, type, location, status, manufacturer, model_number, install_date, last_maintenance, next_maintenance, health_score) VALUES
('CNC Milling Machine #1', 'CNC Machine', 'Building A - Bay 1', 'operational', 'Haas Automation', 'VF-2SS', '2020-03-15', '2025-12-01', '2026-03-01', 92.50),
('CNC Milling Machine #2', 'CNC Machine', 'Building A - Bay 2', 'operational', 'Haas Automation', 'VF-3', '2019-07-20', '2025-11-15', '2026-02-15', 87.30),
('Hydraulic Press #1', 'Press', 'Building B - Bay 1', 'maintenance', 'Schuler Group', 'MSD-400', '2018-01-10', '2025-10-20', '2026-01-20', 68.00),
('Industrial Air Compressor', 'Compressor', 'Utility Room 1', 'operational', 'Atlas Copco', 'GA-90', '2021-05-25', '2026-01-05', '2026-04-05', 95.00),
('Centrifugal Pump Station A', 'Pump', 'Building C - Basement', 'operational', 'Grundfos', 'CR-95-3', '2020-11-12', '2025-12-20', '2026-03-20', 89.20),
('Steam Turbine Generator', 'Turbine', 'Power House', 'operational', 'Siemens', 'SST-400', '2017-06-01', '2025-09-15', '2026-03-15', 78.50),
('Conveyor Belt System #1', 'Conveyor', 'Building A - Assembly Line', 'operational', 'Dorner', 'AquaPruf-7600', '2021-02-28', '2026-01-10', '2026-04-10', 94.00),
('Robotic Welding Arm #1', 'Robot', 'Building B - Welding Cell', 'operational', 'FANUC', 'Arc Mate 100iD', '2022-08-15', '2025-12-18', '2026-03-18', 96.80),
('Industrial Chiller Unit', 'HVAC', 'Utility Room 2', 'warning', 'Carrier', '30RBP-180', '2019-04-22', '2025-11-01', '2026-02-01', 72.40),
('Overhead Bridge Crane', 'Crane', 'Building A - Main Hall', 'operational', 'Konecranes', 'CXT-20', '2018-09-05', '2025-10-30', '2026-01-30', 85.60),
('CNC Lathe #1', 'CNC Machine', 'Building A - Bay 3', 'operational', 'DMG Mori', 'NLX-2500', '2021-01-18', '2026-01-12', '2026-04-12', 91.00),
('Injection Molding Machine', 'Molding', 'Building D - Bay 1', 'operational', 'Arburg', 'Allrounder 820S', '2020-06-30', '2025-12-05', '2026-03-05', 88.70),
('Electric Arc Furnace', 'Furnace', 'Building E - Foundry', 'operational', 'SMS Group', 'EAF-50', '2016-11-20', '2025-08-25', '2026-02-25', 74.30),
('Packaging Line #1', 'Packaging', 'Building F - Packaging', 'maintenance', 'Bosch Packaging', 'SVE-2520', '2019-12-10', '2025-10-15', '2026-01-15', 65.20),
('Water Treatment System', 'Treatment', 'Water Plant', 'operational', 'Evoqua', 'DAVCO-JC', '2020-08-05', '2025-12-22', '2026-03-22', 90.10);

-- Seed Sensors
INSERT INTO sensors (equipment_id, name, type, unit, min_threshold, max_threshold, status, last_reading, last_reading_at) VALUES
(1, 'Spindle Vibration Sensor', 'vibration', 'mm/s', 0.00, 7.10, 'active', 3.20, NOW() - INTERVAL '5 minutes'),
(1, 'Spindle Temperature Sensor', 'temperature', '°C', 15.00, 65.00, 'active', 42.50, NOW() - INTERVAL '5 minutes'),
(2, 'Coolant Flow Rate Sensor', 'flow_rate', 'L/min', 2.00, 15.00, 'active', 8.70, NOW() - INTERVAL '10 minutes'),
(3, 'Hydraulic Pressure Sensor', 'pressure', 'bar', 50.00, 350.00, 'active', 285.00, NOW() - INTERVAL '3 minutes'),
(3, 'Oil Temperature Sensor', 'temperature', '°C', 20.00, 80.00, 'active', 72.50, NOW() - INTERVAL '3 minutes'),
(4, 'Discharge Pressure Sensor', 'pressure', 'bar', 5.00, 13.00, 'active', 10.20, NOW() - INTERVAL '7 minutes'),
(4, 'Air Temperature Sensor', 'temperature', '°C', 10.00, 50.00, 'active', 35.80, NOW() - INTERVAL '7 minutes'),
(5, 'Pump Vibration Sensor', 'vibration', 'mm/s', 0.00, 5.60, 'active', 2.10, NOW() - INTERVAL '2 minutes'),
(5, 'Flow Rate Sensor', 'flow_rate', 'm³/h', 10.00, 95.00, 'active', 67.30, NOW() - INTERVAL '2 minutes'),
(6, 'Bearing Temperature Sensor', 'temperature', '°C', 30.00, 120.00, 'active', 88.40, NOW() - INTERVAL '1 minute'),
(6, 'RPM Sensor', 'speed', 'RPM', 2800.00, 3600.00, 'active', 3150.00, NOW() - INTERVAL '1 minute'),
(7, 'Belt Speed Sensor', 'speed', 'm/min', 5.00, 30.00, 'active', 18.50, NOW() - INTERVAL '4 minutes'),
(8, 'Joint Temperature Sensor', 'temperature', '°C', 10.00, 70.00, 'active', 38.20, NOW() - INTERVAL '6 minutes'),
(9, 'Refrigerant Pressure Sensor', 'pressure', 'bar', 2.00, 25.00, 'active', 21.80, NOW() - INTERVAL '8 minutes'),
(9, 'Coolant Temperature Sensor', 'temperature', '°C', 5.00, 15.00, 'warning', 13.80, NOW() - INTERVAL '8 minutes'),
(10, 'Load Cell Sensor', 'weight', 'tonnes', 0.00, 20.00, 'active', 12.50, NOW() - INTERVAL '15 minutes'),
(11, 'Chuck Vibration Sensor', 'vibration', 'mm/s', 0.00, 6.30, 'active', 2.80, NOW() - INTERVAL '9 minutes'),
(12, 'Barrel Temperature Sensor', 'temperature', '°C', 150.00, 300.00, 'active', 235.00, NOW() - INTERVAL '4 minutes'),
(13, 'Furnace Temperature Sensor', 'temperature', '°C', 1200.00, 1800.00, 'active', 1580.00, NOW() - INTERVAL '1 minute'),
(14, 'Motor Current Sensor', 'current', 'A', 5.00, 40.00, 'active', 32.50, NOW() - INTERVAL '12 minutes'),
(15, 'pH Sensor', 'ph', 'pH', 6.50, 8.50, 'active', 7.20, NOW() - INTERVAL '3 minutes');

-- Seed Sensor Readings (multiple readings per sensor)
INSERT INTO sensor_readings (sensor_id, value, timestamp, is_anomaly) VALUES
(1, 3.10, NOW() - INTERVAL '60 minutes', FALSE),
(1, 3.25, NOW() - INTERVAL '55 minutes', FALSE),
(1, 3.18, NOW() - INTERVAL '50 minutes', FALSE),
(1, 6.80, NOW() - INTERVAL '45 minutes', TRUE),
(1, 3.30, NOW() - INTERVAL '40 minutes', FALSE),
(1, 3.15, NOW() - INTERVAL '35 minutes', FALSE),
(1, 3.22, NOW() - INTERVAL '30 minutes', FALSE),
(1, 3.20, NOW() - INTERVAL '25 minutes', FALSE),
(2, 41.00, NOW() - INTERVAL '60 minutes', FALSE),
(2, 42.20, NOW() - INTERVAL '50 minutes', FALSE),
(2, 43.10, NOW() - INTERVAL '40 minutes', FALSE),
(2, 42.50, NOW() - INTERVAL '30 minutes', FALSE),
(2, 64.80, NOW() - INTERVAL '20 minutes', TRUE),
(2, 42.80, NOW() - INTERVAL '10 minutes', FALSE),
(3, 8.50, NOW() - INTERVAL '55 minutes', FALSE),
(4, 280.00, NOW() - INTERVAL '50 minutes', FALSE),
(4, 285.00, NOW() - INTERVAL '40 minutes', FALSE),
(4, 340.00, NOW() - INTERVAL '30 minutes', TRUE),
(4, 290.00, NOW() - INTERVAL '20 minutes', FALSE),
(5, 68.00, NOW() - INTERVAL '45 minutes', FALSE),
(5, 71.50, NOW() - INTERVAL '35 minutes', FALSE),
(5, 79.50, NOW() - INTERVAL '25 minutes', TRUE),
(5, 72.50, NOW() - INTERVAL '15 minutes', FALSE),
(6, 10.00, NOW() - INTERVAL '40 minutes', FALSE),
(6, 10.30, NOW() - INTERVAL '30 minutes', FALSE),
(6, 10.10, NOW() - INTERVAL '20 minutes', FALSE),
(7, 35.00, NOW() - INTERVAL '35 minutes', FALSE),
(8, 2.00, NOW() - INTERVAL '50 minutes', FALSE),
(8, 2.15, NOW() - INTERVAL '40 minutes', FALSE),
(8, 2.08, NOW() - INTERVAL '30 minutes', FALSE),
(9, 65.00, NOW() - INTERVAL '45 minutes', FALSE),
(9, 67.50, NOW() - INTERVAL '35 minutes', FALSE),
(10, 85.00, NOW() - INTERVAL '55 minutes', FALSE),
(10, 87.20, NOW() - INTERVAL '45 minutes', FALSE),
(10, 88.40, NOW() - INTERVAL '35 minutes', FALSE),
(10, 115.00, NOW() - INTERVAL '25 minutes', TRUE),
(10, 89.00, NOW() - INTERVAL '15 minutes', FALSE),
(11, 3100.00, NOW() - INTERVAL '50 minutes', FALSE),
(11, 3150.00, NOW() - INTERVAL '40 minutes', FALSE),
(12, 18.20, NOW() - INTERVAL '30 minutes', FALSE),
(13, 37.50, NOW() - INTERVAL '25 minutes', FALSE),
(14, 20.50, NOW() - INTERVAL '40 minutes', FALSE),
(14, 24.80, NOW() - INTERVAL '30 minutes', TRUE),
(15, 13.20, NOW() - INTERVAL '35 minutes', FALSE),
(15, 13.80, NOW() - INTERVAL '25 minutes', FALSE),
(16, 12.50, NOW() - INTERVAL '20 minutes', FALSE),
(17, 2.60, NOW() - INTERVAL '45 minutes', FALSE),
(17, 2.80, NOW() - INTERVAL '35 minutes', FALSE),
(18, 230.00, NOW() - INTERVAL '30 minutes', FALSE),
(18, 235.00, NOW() - INTERVAL '20 minutes', FALSE),
(19, 1560.00, NOW() - INTERVAL '25 minutes', FALSE),
(19, 1580.00, NOW() - INTERVAL '15 minutes', FALSE),
(20, 30.00, NOW() - INTERVAL '30 minutes', FALSE),
(20, 32.50, NOW() - INTERVAL '20 minutes', FALSE),
(21, 7.10, NOW() - INTERVAL '35 minutes', FALSE),
(21, 7.20, NOW() - INTERVAL '25 minutes', FALSE);

-- Seed Maintenance Schedules
INSERT INTO maintenance_schedules (equipment_id, title, description, schedule_type, frequency, next_due, priority, assigned_to, status) VALUES
(1, 'CNC Mill #1 Quarterly Service', 'Full spindle inspection, coolant system flush, axis calibration', 'preventive', 'quarterly', '2026-04-01', 'high', 'Mike Johnson', 'scheduled'),
(2, 'CNC Mill #2 Oil Change', 'Replace way oil and hydraulic fluid', 'preventive', 'monthly', '2026-04-15', 'medium', 'Mike Johnson', 'scheduled'),
(3, 'Hydraulic Press Seal Replacement', 'Replace main cylinder seals and check pressure relief valves', 'corrective', 'as_needed', '2026-03-20', 'critical', 'David Park', 'in_progress'),
(4, 'Compressor Filter Replacement', 'Replace air intake and oil separator filters', 'preventive', 'monthly', '2026-04-05', 'medium', 'Emily Chen', 'scheduled'),
(5, 'Pump Bearing Inspection', 'Inspect and grease pump bearings, check alignment', 'preventive', 'quarterly', '2026-05-12', 'medium', 'David Park', 'scheduled'),
(6, 'Turbine Annual Overhaul', 'Full turbine blade inspection, bearing replacement, alignment check', 'preventive', 'annually', '2026-06-01', 'critical', 'Robert Garcia', 'scheduled'),
(7, 'Conveyor Belt Tension Adjustment', 'Check and adjust belt tension, inspect rollers', 'preventive', 'weekly', '2026-03-23', 'low', 'Emily Chen', 'scheduled'),
(8, 'Robot Calibration', 'Full axis calibration and torch tip replacement', 'preventive', 'quarterly', '2026-05-15', 'high', 'Lisa Wang', 'scheduled'),
(9, 'Chiller Refrigerant Check', 'Check refrigerant levels and inspect compressor', 'corrective', 'as_needed', '2026-03-18', 'high', 'Kevin Brown', 'in_progress'),
(10, 'Crane Load Test', 'Annual load test and wire rope inspection', 'preventive', 'annually', '2026-09-05', 'critical', 'David Park', 'scheduled'),
(11, 'CNC Lathe Turret Service', 'Turret alignment and tool holder inspection', 'preventive', 'quarterly', '2026-04-18', 'medium', 'Mike Johnson', 'scheduled'),
(12, 'Injection Molder Screw Inspection', 'Inspect screw and barrel wear, check nozzle', 'preventive', 'semi_annually', '2026-06-30', 'high', 'Robert Garcia', 'scheduled'),
(13, 'Furnace Refractory Inspection', 'Inspect refractory lining and electrodes', 'preventive', 'monthly', '2026-04-20', 'critical', 'Kevin Brown', 'scheduled'),
(14, 'Packaging Line Overhaul', 'Complete overhaul of filling and sealing stations', 'corrective', 'as_needed', '2026-03-25', 'high', 'Emily Chen', 'in_progress'),
(15, 'Water Treatment System Calibration', 'Calibrate pH and conductivity sensors, replace membranes', 'preventive', 'monthly', '2026-04-05', 'medium', 'Lisa Wang', 'scheduled');

-- Seed Alerts
INSERT INTO alerts (equipment_id, sensor_id, type, severity, message, status, acknowledged_by, acknowledged_at) VALUES
(1, 1, 'vibration_spike', 'warning', 'Spindle vibration exceeded 6.8 mm/s on CNC Mill #1. Threshold: 7.1 mm/s. Monitor closely.', 'acknowledged', 'Mike Johnson', NOW() - INTERVAL '40 minutes'),
(2, 2, 'temperature_high', 'warning', 'Spindle temperature reached 64.8°C on CNC Mill #2. Approaching max threshold of 65°C.', 'active', NULL, NULL),
(3, 4, 'pressure_spike', 'critical', 'Hydraulic pressure spike to 340 bar on Press #1. Max threshold: 350 bar. Immediate inspection required.', 'active', NULL, NULL),
(3, 5, 'temperature_high', 'warning', 'Oil temperature at 79.5°C on Hydraulic Press #1. Max threshold: 80°C.', 'acknowledged', 'David Park', NOW() - INTERVAL '20 minutes'),
(6, 10, 'temperature_critical', 'critical', 'Bearing temperature reached 115°C on Steam Turbine. Max threshold: 120°C. Risk of bearing failure.', 'active', NULL, NULL),
(9, 14, 'pressure_high', 'warning', 'Refrigerant pressure at 21.8 bar on Chiller Unit. Approaching max of 25 bar.', 'active', NULL, NULL),
(9, 15, 'temperature_drift', 'info', 'Coolant temperature drifting upward on Chiller Unit. Currently 13.8°C, max 15°C.', 'active', NULL, NULL),
(14, 20, 'current_high', 'warning', 'Motor current at 32.5A on Packaging Line #1. Threshold: 40A. Possible mechanical resistance.', 'active', NULL, NULL),
(5, 8, 'vibration_normal', 'info', 'Pump vibration levels returned to normal range after maintenance adjustment.', 'resolved', 'David Park', NOW() - INTERVAL '2 hours'),
(13, 19, 'temperature_normal', 'info', 'Furnace temperature stabilized at 1580°C within operating range.', 'resolved', 'Kevin Brown', NOW() - INTERVAL '1 hour'),
(1, NULL, 'maintenance_due', 'info', 'CNC Mill #1 quarterly maintenance is coming due on 2026-04-01.', 'active', NULL, NULL),
(6, NULL, 'maintenance_due', 'warning', 'Steam Turbine annual overhaul scheduled for 2026-06-01. Pre-planning required.', 'active', NULL, NULL),
(3, NULL, 'health_score_low', 'critical', 'Hydraulic Press #1 health score dropped to 68%. Corrective maintenance in progress.', 'acknowledged', 'Angela Brooks', NOW() - INTERVAL '3 hours'),
(14, NULL, 'health_score_low', 'critical', 'Packaging Line #1 health score at 65.2%. Multiple components need attention.', 'active', NULL, NULL),
(13, NULL, 'health_score_low', 'warning', 'Electric Arc Furnace health score at 74.3%. Refractory inspection recommended.', 'active', NULL, NULL);

-- Seed Work Orders
INSERT INTO work_orders (equipment_id, title, description, priority, status, assigned_to, estimated_hours, actual_hours, cost, due_date, completed_at) VALUES
(3, 'Replace Hydraulic Cylinder Seals', 'Main cylinder seals are leaking. Replace all seals and inspect cylinder bore.', 'critical', 'in_progress', 'David Park', 8.00, NULL, NULL, '2026-03-20', NULL),
(9, 'Chiller Compressor Repair', 'Compressor showing signs of refrigerant leak. Locate and repair leak, recharge system.', 'high', 'in_progress', 'Kevin Brown', 6.00, NULL, NULL, '2026-03-18', NULL),
(14, 'Packaging Line Motor Replacement', 'Main drive motor showing excessive current draw. Replace motor and realign.', 'high', 'open', 'Emily Chen', 10.00, NULL, NULL, '2026-03-25', NULL),
(1, 'CNC Mill #1 Spindle Bearing Service', 'Preventive replacement of spindle bearings based on vibration analysis.', 'medium', 'scheduled', 'Mike Johnson', 12.00, NULL, NULL, '2026-04-01', NULL),
(6, 'Turbine Bearing Inspection', 'Bearing temperature trending high. Inspect bearing condition and lubrication.', 'high', 'open', 'Robert Garcia', 4.00, NULL, NULL, '2026-03-22', NULL),
(2, 'CNC Mill #2 Coolant System Service', 'Flush coolant system, replace filters, check pump operation.', 'medium', 'completed', 'Mike Johnson', 3.00, 3.50, 450.00, '2026-02-15', '2026-02-14 16:30:00'),
(7, 'Conveyor Belt Replacement', 'Replace worn conveyor belt section on Assembly Line.', 'medium', 'completed', 'Emily Chen', 5.00, 4.50, 1200.00, '2026-01-20', '2026-01-19 14:00:00'),
(4, 'Compressor Filter Change', 'Routine air intake and oil separator filter replacement.', 'low', 'completed', 'Emily Chen', 2.00, 1.50, 320.00, '2026-01-10', '2026-01-09 10:00:00'),
(10, 'Crane Wire Rope Inspection', 'Inspect wire ropes for wear, check brakes and limit switches.', 'high', 'completed', 'David Park', 6.00, 7.00, 850.00, '2025-12-15', '2025-12-15 15:00:00'),
(11, 'CNC Lathe Tool Holder Replacement', 'Replace worn tool holders on turret positions 3 and 7.', 'medium', 'completed', 'Mike Johnson', 2.00, 2.00, 680.00, '2026-01-15', '2026-01-14 11:00:00'),
(5, 'Pump Alignment Correction', 'Correct pump-motor alignment after vibration analysis indicated misalignment.', 'medium', 'completed', 'David Park', 4.00, 3.00, 200.00, '2025-12-22', '2025-12-21 13:00:00'),
(12, 'Injection Molder Heater Band Replacement', 'Replace failed heater band on barrel zone 3.', 'high', 'completed', 'Robert Garcia', 3.00, 3.50, 520.00, '2026-02-10', '2026-02-09 16:00:00'),
(13, 'Furnace Electrode Replacement', 'Replace worn electrodes and inspect contact clamps.', 'critical', 'completed', 'Kevin Brown', 16.00, 18.00, 4500.00, '2025-11-20', '2025-11-20 20:00:00'),
(8, 'Robot Torch Tip Replacement', 'Replace welding torch tip and recalibrate wire feed.', 'low', 'completed', 'Lisa Wang', 1.50, 1.00, 150.00, '2026-02-20', '2026-02-19 09:00:00'),
(15, 'Water Treatment Membrane Replacement', 'Replace RO membranes and recalibrate sensors.', 'medium', 'completed', 'Lisa Wang', 8.00, 9.00, 3200.00, '2025-12-28', '2025-12-28 17:00:00');

-- Seed Failure Analysis
INSERT INTO failure_analysis (equipment_id, failure_date, failure_type, root_cause, impact, corrective_action, prevention_plan, ai_analysis, status) VALUES
(3, '2026-03-10', 'seal_failure', 'Hydraulic cylinder seals degraded due to high oil temperature exposure', 'Production line B halted for 6 hours', 'Replace all cylinder seals and install oil cooler', 'Monthly oil temperature monitoring, replace seals every 18 months', 'Analysis indicates thermal degradation of nitrile seals. Recommend upgrading to Viton seals rated for higher temperatures.', 'in_progress'),
(13, '2025-11-15', 'electrode_wear', 'Excessive arc duration and incorrect power settings caused accelerated electrode wear', 'Reduced melt capacity by 30% for 2 days', 'Replaced electrodes and recalibrated power settings', 'Implement power monitoring system, train operators on optimal settings', 'Root cause confirmed as operational parameter drift. AI recommends real-time power monitoring with automatic correction.', 'closed'),
(7, '2026-01-15', 'belt_wear', 'Misaligned tracking caused uneven belt wear on one edge', 'Assembly line speed reduced by 40% for 1 day', 'Replaced belt and corrected tracking alignment', 'Weekly tracking checks, install belt tracking sensors', 'Belt wear pattern consistent with tracking misalignment. Recommend installing automatic belt tracking system.', 'closed'),
(5, '2025-12-18', 'vibration_high', 'Pump-motor coupling misalignment after foundation settlement', 'Increased noise and energy consumption', 'Corrected alignment using laser alignment tool', 'Quarterly alignment checks, install continuous vibration monitoring', 'Vibration signature indicates angular misalignment. Foundation monitoring recommended.', 'closed'),
(9, '2026-03-08', 'refrigerant_leak', 'Vibration-induced fatigue crack in refrigerant copper piping', 'Cooling capacity reduced by 50%, production areas above temperature spec', 'Locate and braze leak, add vibration dampeners to piping', 'Install vibration dampeners on all refrigerant lines, quarterly leak detection', 'Fatigue analysis suggests vibration from compressor is the root cause. Recommend flexible connections.', 'in_progress'),
(14, '2026-03-05', 'motor_failure', 'Motor winding insulation breakdown due to age and overloading', 'Packaging line completely down for estimated 3 days', 'Replace motor with higher rated unit', 'Install motor current monitoring, replace motors proactively at 80% of rated life', 'Motor failure consistent with insulation class F degradation. Current draw pattern shows progressive overloading.', 'open'),
(2, '2025-11-10', 'coolant_contamination', 'Coolant not replaced on schedule, bacterial growth caused coolant failure', 'Poor surface finish on machined parts, 12 parts scrapped', 'Flushed system and replaced coolant with fresh mixture', 'Strict adherence to coolant replacement schedule, install coolant concentration monitor', 'Bacterial contamination is the root cause. Recommend automatic coolant monitoring system.', 'closed'),
(6, '2025-09-10', 'bearing_overheat', 'Insufficient lubrication due to clogged oil supply line', 'Turbine shutdown for 24 hours, power generation impact', 'Cleared oil line, replaced bearing, installed inline filter', 'Install oil flow sensors on bearing supply lines, quarterly oil analysis', 'Bearing failure initiated by lubricant starvation. Oil analysis shows particulate contamination in supply.', 'closed'),
(10, '2025-12-10', 'wire_rope_damage', 'Wire rope surface damage from drum groove misalignment', 'Crane load limited to 50% capacity for 5 days', 'Replaced wire rope and machined drum grooves', 'Annual drum groove inspection, rope replacement every 3 years regardless of condition', 'Wire rope failure mode is consistent with fleet angle issues. Recommend drum groove profiling.', 'closed'),
(12, '2026-02-05', 'heater_failure', 'Heater band electrical connection corroded causing hot spot', 'Barrel zone 3 temperature unstable, 8 hours of production loss', 'Replaced heater band and cleaned all connections', 'Annual inspection of all heater band connections, apply anti-corrosion compound', 'Thermal imaging confirms localized hot spot from poor contact. Corrosion likely from hydraulic oil mist.', 'closed'),
(1, '2025-08-20', 'spindle_vibration', 'Bearing preload reduced over time causing increased vibration', 'Reduced machining accuracy, tolerance issues on precision parts', 'Adjusted bearing preload, monitored vibration levels', 'Install continuous vibration monitoring, replace bearings at 15000 hour intervals', 'Vibration spectrum analysis shows bearing defect frequency. Recommend bearing replacement within next quarter.', 'closed'),
(11, '2026-01-10', 'tool_holder_wear', 'Tool holder taper worn from repeated tool changes without cleaning', 'Tool runout exceeded tolerance, surface finish issues', 'Replaced worn tool holders and implemented cleaning procedure', 'Clean tapers before every tool change, inspect holders monthly', 'Wear pattern indicates contamination between taper surfaces. Cleaning protocol will prevent recurrence.', 'closed'),
(4, '2025-06-15', 'filter_clog', 'Oil separator filter not replaced on schedule causing pressure drop', 'Compressed air supply pressure dropped below minimum for pneumatic tools', 'Replaced filter and revised maintenance schedule', 'Add filter differential pressure alarm, strict schedule adherence', 'Pressure drop curve indicates gradual filter loading. Recommend differential pressure monitoring.', 'closed'),
(15, '2025-12-20', 'membrane_fouling', 'RO membrane fouled due to inadequate pretreatment', 'Water quality below specification for 2 days', 'Replaced membranes and improved pretreatment process', 'Monthly membrane performance monitoring, improve pretreatment chemical dosing', 'Fouling analysis indicates biological and scaling fouling. Pretreatment optimization required.', 'closed'),
(8, '2026-02-15', 'torch_tip_wear', 'Normal wear accelerated by incorrect wire feed speed setting', 'Weld quality reduced, 5 assemblies required rework', 'Replaced torch tip and corrected wire feed speed', 'Train operators on correct parameter selection, implement parameter lockout', 'Wear pattern and spatter analysis confirm wire feed speed was 15% above optimal.', 'closed');

-- Seed Spare Parts
INSERT INTO spare_parts (name, part_number, category, quantity, min_quantity, unit_cost, supplier, location, compatible_equipment, reorder_status) VALUES
('Spindle Bearing Set', 'BRG-7210-AC', 'Bearings', 4, 2, 850.00, 'SKF Industrial', 'Warehouse A - Shelf 12', 'CNC Milling Machine #1, CNC Milling Machine #2', 'in_stock'),
('Hydraulic Cylinder Seal Kit', 'SEL-MSD400-K1', 'Seals', 2, 3, 320.00, 'Parker Hannifin', 'Warehouse A - Shelf 8', 'Hydraulic Press #1', 'reorder_needed'),
('Compressor Oil Filter', 'FLT-GA90-OF', 'Filters', 12, 4, 45.00, 'Atlas Copco Parts', 'Warehouse B - Shelf 3', 'Industrial Air Compressor', 'in_stock'),
('Conveyor Belt Section (10m)', 'BLT-AP76-10M', 'Belts', 1, 1, 2800.00, 'Dorner Parts', 'Warehouse C - Floor', 'Conveyor Belt System #1', 'in_stock'),
('Pump Mechanical Seal', 'SEL-CR95-MS', 'Seals', 3, 2, 420.00, 'Grundfos Spares', 'Warehouse A - Shelf 9', 'Centrifugal Pump Station A', 'in_stock'),
('Welding Torch Tip Kit', 'TRC-AM100-KT', 'Consumables', 20, 10, 35.00, 'FANUC Parts', 'Warehouse B - Shelf 1', 'Robotic Welding Arm #1', 'in_stock'),
('Turbine Bearing Assembly', 'BRG-SST400-BA', 'Bearings', 1, 1, 4500.00, 'Siemens Spares', 'Warehouse A - Shelf 14', 'Steam Turbine Generator', 'in_stock'),
('Chiller Compressor Gasket Set', 'GSK-30RBP-CS', 'Gaskets', 2, 2, 180.00, 'Carrier Parts', 'Warehouse B - Shelf 5', 'Industrial Chiller Unit', 'in_stock'),
('CNC Lathe Tool Holder', 'THL-NLX25-BMT', 'Tooling', 6, 4, 340.00, 'DMG Mori Parts', 'Warehouse A - Shelf 6', 'CNC Lathe #1', 'in_stock'),
('Injection Molder Heater Band', 'HTR-820S-B3', 'Electrical', 5, 3, 120.00, 'Arburg Spares', 'Warehouse B - Shelf 7', 'Injection Molding Machine', 'in_stock'),
('Furnace Electrode (Graphite)', 'ELC-EAF50-GR', 'Consumables', 3, 2, 1500.00, 'GrafTech', 'Warehouse C - Rack 1', 'Electric Arc Furnace', 'in_stock'),
('Packaging Machine Drive Belt', 'BLT-SVE25-DB', 'Belts', 3, 2, 85.00, 'Bosch Rexroth', 'Warehouse B - Shelf 2', 'Packaging Line #1', 'in_stock'),
('RO Membrane Element', 'MEM-DAVCO-RO', 'Membranes', 2, 4, 800.00, 'Evoqua Spares', 'Warehouse A - Shelf 15', 'Water Treatment System', 'reorder_needed'),
('Crane Wire Rope (50m)', 'WRP-CXT20-50', 'Wire Rope', 1, 1, 2200.00, 'Konecranes Parts', 'Warehouse C - Floor', 'Overhead Bridge Crane', 'in_stock'),
('Hydraulic Oil ISO VG 46 (20L)', 'OIL-HYD-VG46', 'Lubricants', 8, 5, 65.00, 'Shell Lubricants', 'Warehouse B - Shelf 10', 'Hydraulic Press #1, CNC Milling Machine #1', 'in_stock'),
('V-Belt A68', 'BLT-VBA68', 'Belts', 10, 5, 22.00, 'Gates Corporation', 'Warehouse B - Shelf 2', 'Industrial Air Compressor, Packaging Line #1', 'in_stock');

-- Seed Maintenance Logs
INSERT INTO maintenance_logs (equipment_id, work_order_id, type, description, performed_by, duration_hours, cost, parts_used, notes, performed_at) VALUES
(2, 6, 'preventive', 'Flushed coolant system, replaced filters, checked pump. System running clean.', 'Mike Johnson', 3.50, 450.00, 'Coolant filter x2, Coolant concentrate 20L', 'Coolant was heavily contaminated. Recommend shorter replacement interval.', '2026-02-14 16:30:00'),
(7, 7, 'corrective', 'Replaced worn section of conveyor belt. Realigned tracking system.', 'Emily Chen', 4.50, 1200.00, 'Conveyor Belt Section (10m)', 'Belt wear was more severe than expected. New belt tracking within spec.', '2026-01-19 14:00:00'),
(4, 8, 'preventive', 'Replaced air intake filter and oil separator filter. Checked discharge pressure.', 'Emily Chen', 1.50, 320.00, 'Compressor Oil Filter x2', 'Filters were near end of life. Good timing on replacement.', '2026-01-09 10:00:00'),
(10, 9, 'inspection', 'Inspected wire ropes, checked brakes, tested limit switches. Found drum groove wear.', 'David Park', 7.00, 850.00, 'Crane Wire Rope (50m)', 'Drum grooves need machining at next scheduled maintenance.', '2025-12-15 15:00:00'),
(11, 10, 'corrective', 'Replaced worn tool holders on turret positions 3 and 7. Verified runout.', 'Mike Johnson', 2.00, 680.00, 'CNC Lathe Tool Holder x2', 'Runout now within 0.005mm on all positions.', '2026-01-14 11:00:00'),
(5, 11, 'corrective', 'Corrected pump-motor alignment using laser alignment tool. Vibration reduced.', 'David Park', 3.00, 200.00, NULL, 'Angular misalignment was 0.08mm. Corrected to 0.02mm.', '2025-12-21 13:00:00'),
(12, 12, 'corrective', 'Replaced failed heater band on barrel zone 3. Cleaned all connections.', 'Robert Garcia', 3.50, 520.00, 'Injection Molder Heater Band x1', 'Applied anti-corrosion compound to all connections.', '2026-02-09 16:00:00'),
(13, 13, 'corrective', 'Replaced all three electrodes. Inspected and tightened contact clamps.', 'Kevin Brown', 18.00, 4500.00, 'Furnace Electrode (Graphite) x3', 'Electrodes were severely worn. Contact clamps in good condition.', '2025-11-20 20:00:00'),
(8, 14, 'preventive', 'Replaced welding torch tip. Recalibrated wire feed speed. Ran test welds.', 'Lisa Wang', 1.00, 150.00, 'Welding Torch Tip Kit x1', 'Wire feed speed was set too high. Corrected to 8.2 m/min.', '2026-02-19 09:00:00'),
(15, 15, 'preventive', 'Replaced RO membranes and recalibrated pH and conductivity sensors.', 'Lisa Wang', 9.00, 3200.00, 'RO Membrane Element x2', 'Old membranes showed significant biological fouling. Improved pretreatment dosing.', '2025-12-28 17:00:00'),
(1, NULL, 'inspection', 'Quarterly vibration analysis on CNC Mill #1 spindle. Slight increase noted.', 'Mike Johnson', 1.00, 0.00, NULL, 'Vibration increased from 2.8 to 3.2 mm/s. Bearing replacement recommended next quarter.', '2025-12-01 10:00:00'),
(6, NULL, 'preventive', 'Lubrication service on turbine bearings. Oil analysis sample taken.', 'Robert Garcia', 2.00, 300.00, 'Turbine oil 10L', 'Oil analysis results pending. Temperature readings stable.', '2025-09-15 14:00:00'),
(4, NULL, 'inspection', 'Monthly compressor performance check. All parameters within normal range.', 'Emily Chen', 0.50, 0.00, NULL, 'Discharge pressure 10.2 bar, air temperature 35.8°C. Normal operation.', '2026-01-05 08:00:00'),
(9, NULL, 'inspection', 'Quarterly chiller inspection. Noted refrigerant pressure trending high.', 'Kevin Brown', 1.50, 0.00, NULL, 'Refrigerant pressure at 21.8 bar. Possible leak developing. Follow up needed.', '2025-11-01 09:00:00'),
(3, NULL, 'inspection', 'Hydraulic system inspection. Found minor seal weeping on main cylinder.', 'David Park', 1.00, 0.00, NULL, 'Seals showing age. Replacement work order created.', '2025-10-20 11:00:00');

-- Seed Cost Records
INSERT INTO cost_records (equipment_id, category, description, amount, date, budget_category) VALUES
(2, 'maintenance', 'CNC Mill #2 coolant system service - labor and materials', 450.00, '2026-02-14', 'preventive_maintenance'),
(7, 'maintenance', 'Conveyor belt replacement - belt material and labor', 1200.00, '2026-01-19', 'corrective_maintenance'),
(4, 'maintenance', 'Compressor filter replacement - filters and labor', 320.00, '2026-01-09', 'preventive_maintenance'),
(10, 'maintenance', 'Crane wire rope replacement and inspection', 850.00, '2025-12-15', 'preventive_maintenance'),
(11, 'parts', 'CNC Lathe tool holder replacement', 680.00, '2026-01-14', 'corrective_maintenance'),
(5, 'maintenance', 'Pump alignment correction service', 200.00, '2025-12-21', 'corrective_maintenance'),
(12, 'parts', 'Injection molder heater band replacement', 520.00, '2026-02-09', 'corrective_maintenance'),
(13, 'parts', 'Furnace electrode replacement - 3 electrodes', 4500.00, '2025-11-20', 'corrective_maintenance'),
(8, 'consumables', 'Robotic welder torch tip replacement', 150.00, '2026-02-19', 'preventive_maintenance'),
(15, 'parts', 'Water treatment RO membrane replacement', 3200.00, '2025-12-28', 'preventive_maintenance'),
(3, 'parts', 'Hydraulic cylinder seal kit procurement', 640.00, '2026-03-12', 'corrective_maintenance'),
(9, 'maintenance', 'Chiller refrigerant recharge and leak repair', 1800.00, '2026-03-10', 'corrective_maintenance'),
(6, 'maintenance', 'Turbine bearing lubrication service', 300.00, '2025-09-15', 'preventive_maintenance'),
(1, 'inspection', 'CNC Mill #1 vibration analysis - quarterly', 150.00, '2025-12-01', 'condition_monitoring'),
(14, 'parts', 'Packaging line motor procurement', 2400.00, '2026-03-08', 'corrective_maintenance');

-- Seed Reports
INSERT INTO reports (title, type, description, parameters, generated_by, file_url, status) VALUES
('Monthly Maintenance Summary - January 2026', 'maintenance_summary', 'Summary of all maintenance activities for January 2026', '{"month": "2026-01", "include_costs": true}', 'Sarah Mitchell', '/reports/maintenance-jan-2026.pdf', 'completed'),
('Equipment Health Report Q4 2025', 'health_report', 'Quarterly health assessment of all critical equipment', '{"quarter": "Q4-2025", "equipment_category": "all"}', 'James Carter', '/reports/health-q4-2025.pdf', 'completed'),
('Cost Analysis - Corrective vs Preventive 2025', 'cost_analysis', 'Annual comparison of corrective and preventive maintenance costs', '{"year": "2025", "categories": ["corrective", "preventive"]}', 'Tom Wilson', '/reports/cost-analysis-2025.pdf', 'completed'),
('Failure Trend Analysis - CNC Machines', 'failure_analysis', 'Analysis of failure patterns in CNC machines over past 12 months', '{"equipment_type": "CNC Machine", "period": "12_months"}', 'Lisa Wang', '/reports/cnc-failure-trends.pdf', 'completed'),
('Spare Parts Inventory Report', 'inventory', 'Current inventory levels and reorder recommendations', '{"include_reorder": true, "low_stock_only": false}', 'Daniel Taylor', '/reports/inventory-mar-2026.pdf', 'completed'),
('Weekly Sensor Anomaly Report', 'anomaly_report', 'Summary of all sensor anomalies detected this week', '{"week": "2026-W11", "severity": "all"}', 'Tom Wilson', '/reports/anomaly-w11-2026.pdf', 'completed'),
('Equipment Downtime Analysis - February 2026', 'downtime_analysis', 'Analysis of unplanned downtime events and their impact', '{"month": "2026-02", "include_root_cause": true}', 'Sarah Mitchell', '/reports/downtime-feb-2026.pdf', 'completed'),
('Predictive Maintenance ROI Report', 'roi_analysis', 'Return on investment analysis for predictive maintenance program', '{"period": "2025-full-year", "include_projections": true}', 'Patricia Anderson', '/reports/pm-roi-2025.pdf', 'completed'),
('Turbine Health Deep Dive', 'equipment_deep_dive', 'Detailed health analysis of Steam Turbine Generator', '{"equipment_id": 6, "include_ai_analysis": true}', 'Robert Garcia', '/reports/turbine-deep-dive.pdf', 'completed'),
('March 2026 Maintenance Schedule', 'schedule', 'Upcoming maintenance schedule for March 2026', '{"month": "2026-03", "include_resources": true}', 'Angela Brooks', '/reports/schedule-mar-2026.pdf', 'completed'),
('Energy Consumption by Equipment', 'energy_report', 'Energy consumption analysis per equipment unit', '{"period": "2025-Q4", "top_consumers": 10}', 'Tom Wilson', '/reports/energy-q4-2025.pdf', 'completed'),
('Vendor Performance Report', 'vendor_analysis', 'Evaluation of spare parts vendor performance', '{"year": "2025", "metrics": ["delivery_time", "quality", "cost"]}', 'Daniel Taylor', '/reports/vendor-perf-2025.pdf', 'completed'),
('Compliance Audit Report', 'compliance', 'Annual compliance audit for maintenance procedures', '{"year": "2025", "standards": ["ISO 55001", "OSHA"]}', 'Jennifer Lee', '/reports/compliance-2025.pdf', 'completed'),
('AI Prediction Accuracy Report', 'ai_performance', 'Assessment of AI prediction model accuracy', '{"period": "2025-H2", "models": ["failure_prediction", "anomaly_detection"]}', 'Lisa Wang', NULL, 'in_progress'),
('Budget Forecast - Q2 2026', 'budget_forecast', 'Maintenance budget forecast for Q2 2026', '{"quarter": "Q2-2026", "include_contingency": true}', 'Patricia Anderson', NULL, 'pending');

-- Feature Expansion Plan: Asset Registry
INSERT INTO asset_hierarchy (equipment_id, parent_equipment_id, site, area, production_line, asset_path)
SELECT id, NULL, 'Main Factory',
       CASE WHEN id % 5 = 0 THEN 'Utilities' WHEN id % 5 = 1 THEN 'Building A' WHEN id % 5 = 2 THEN 'Building B' WHEN id % 5 = 3 THEN 'Building C' ELSE 'Building D' END,
       CASE WHEN id % 4 = 0 THEN 'Line 4' WHEN id % 4 = 1 THEN 'Machining Line' WHEN id % 4 = 2 THEN 'Assembly Line' ELSE 'Process Line' END,
       'Main Factory / ' || location || ' / ' || name
FROM equipment;

INSERT INTO asset_criticality (equipment_id, criticality_score, downtime_cost_per_hour, safety_impact, production_impact, risk_category, review_notes)
SELECT id, 55 + ((id * 3) % 40), 1200 + (id * 450),
       CASE WHEN id IN (3,6,10,13) THEN 'high' ELSE 'medium' END,
       CASE WHEN health_score < 75 THEN 'critical' WHEN health_score < 88 THEN 'high' ELSE 'medium' END,
       CASE WHEN health_score < 75 THEN 'critical_asset' ELSE 'production_asset' END,
       'Criticality model considers safety exposure, production bottleneck, downtime cost, and redundancy.'
FROM equipment;

INSERT INTO asset_warranty (equipment_id, warranty_provider, contract_number, start_date, end_date, coverage_details, claim_status)
SELECT id, manufacturer || ' Service', 'WR-' || LPAD(id::text, 5, '0'), install_date, install_date + INTERVAL '7 years',
       'Coverage includes major components, remote diagnostics, and priority field service subject to operating limits.',
       CASE WHEN install_date + INTERVAL '7 years' < CURRENT_DATE THEN 'expired' ELSE 'active' END
FROM equipment;

-- Feature Expansion Plan: Sensor Ingestion
INSERT INTO sensor_ingestion_batches (source_system, batch_type, reading_count, accepted_count, rejected_count, status, started_at, completed_at) VALUES
('AWS IoT Core', 'stream', 1250, 1238, 12, 'processed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 58 minutes'),
('Azure IoT Hub', 'batch', 980, 970, 10, 'processed', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 57 minutes'),
('MQTT Gateway A', 'stream', 1430, 1411, 19, 'quality_review', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 58 minutes'),
('Historian Import', 'batch', 760, 760, 0, 'processed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 55 minutes'),
('Edge Gateway B', 'stream', 1188, 1175, 13, 'processed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 58 minutes'),
('PLC Collector', 'batch', 640, 631, 9, 'processed', NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '86 minutes'),
('SCADA Export', 'batch', 820, 810, 10, 'processed', NOW() - INTERVAL '75 minutes', NOW() - INTERVAL '70 minutes'),
('OPC-UA Bridge', 'stream', 1320, 1304, 16, 'quality_review', NOW() - INTERVAL '60 minutes', NOW() - INTERVAL '58 minutes'),
('Wireless Sensor Mesh', 'stream', 905, 887, 18, 'processed', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '42 minutes'),
('Vibration Edge Node', 'stream', 1505, 1490, 15, 'processed', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes'),
('Energy Meter Gateway', 'batch', 530, 526, 4, 'processed', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '22 minutes'),
('Runtime Counter Import', 'batch', 460, 455, 5, 'processed', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes'),
('Error Code Collector', 'stream', 300, 292, 8, 'processed', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '14 minutes'),
('Pressure Sensor Gateway', 'stream', 710, 705, 5, 'processed', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes'),
('Temperature Sensor Gateway', 'stream', 690, 681, 9, 'processed', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '4 minutes');

INSERT INTO sensor_quality_events (batch_id, sensor_id, event_type, severity, message)
SELECT b.id, ((b.id - 1) % 21) + 1,
       CASE WHEN b.id % 4 = 0 THEN 'missing_timestamp' WHEN b.id % 4 = 1 THEN 'out_of_range' WHEN b.id % 4 = 2 THEN 'duplicate_reading' ELSE 'stale_sensor' END,
       CASE WHEN b.rejected_count > 15 THEN 'high' WHEN b.rejected_count > 8 THEN 'medium' ELSE 'low' END,
       'Quality event detected during ingestion validation; affected readings were quarantined or corrected.'
FROM sensor_ingestion_batches b;

-- Feature Expansion Plan: Anomaly Detection
INSERT INTO anomaly_events (equipment_id, sensor_id, anomaly_type, severity, score, detected_at, status, summary)
SELECT s.equipment_id, s.id,
       CASE WHEN s.type = 'vibration' THEN 'vibration_outlier' WHEN s.type = 'temperature' THEN 'thermal_drift' WHEN s.type = 'pressure' THEN 'pressure_breach' ELSE 'pattern_shift' END,
       CASE WHEN s.status = 'warning' THEN 'high' WHEN s.last_reading > COALESCE(s.max_threshold, s.last_reading + 1) * 0.9 THEN 'medium' ELSE 'low' END,
       60 + ((s.id * 4) % 38),
       COALESCE(s.last_reading_at, NOW()),
       CASE WHEN s.status = 'warning' THEN 'investigating' ELSE 'open' END,
       'Detected anomaly using threshold, drift, and correlated sensor checks.'
FROM sensors s
WHERE s.id <= 15;

INSERT INTO anomaly_explanations (anomaly_event_id, explanation, evidence, confidence, recommended_action)
SELECT id,
       'Sensor behavior deviated from recent baseline and correlated with asset health or operating condition changes.',
       'Evidence includes last reading, threshold proximity, recent alert context, and historical failure signatures.',
       72 + (id % 20),
       'Review sensor trend, inspect related component, and decide whether to create a work order.'
FROM anomaly_events;

-- Feature Expansion Plan: Predictive Maintenance Scheduling
INSERT INTO predictive_schedule_recommendations (equipment_id, recommended_window_start, recommended_window_end, failure_probability, priority, labor_hours, required_parts, recommendation, status)
SELECT id,
       NOW() + (id * INTERVAL '2 days'),
       NOW() + (id * INTERVAL '2 days') + INTERVAL '4 hours',
       LEAST(95, 25 + ((100 - health_score)::int)),
       CASE WHEN health_score < 75 THEN 'critical' WHEN health_score < 88 THEN 'high' ELSE 'medium' END,
       2 + (id % 8),
       CASE WHEN type ILIKE '%CNC%' THEN 'Spindle Bearing Set, Hydraulic Oil' WHEN type = 'Press' THEN 'Hydraulic Cylinder Seal Kit' WHEN type = 'Compressor' THEN 'Compressor Oil Filter' ELSE 'Standard PM kit' END,
       'Recommended maintenance window balances failure probability, labor capacity, production impact, and parts availability.',
       CASE WHEN health_score < 75 THEN 'ready_to_schedule' ELSE 'proposed' END
FROM equipment;

INSERT INTO maintenance_window_constraints (recommendation_id, constraint_type, description, severity)
SELECT id,
       CASE WHEN id % 4 = 0 THEN 'production_blackout' WHEN id % 4 = 1 THEN 'labor_capacity' WHEN id % 4 = 2 THEN 'parts_availability' ELSE 'safety_lockout' END,
       'Constraint considered by scheduler before committing the recommended maintenance window.',
       CASE WHEN id % 5 = 0 THEN 'critical' WHEN id % 3 = 0 THEN 'high' ELSE 'medium' END
FROM predictive_schedule_recommendations;

-- Feature Expansion Plan: Work Order Generation
INSERT INTO generated_work_orders (source_alert_id, recommendation_id, work_order_id, equipment_id, generation_reason, priority, status, parts_context)
SELECT a.id, psr.id, wo.id, a.equipment_id,
       'Generated from active alert and predictive schedule recommendation.',
       a.severity,
       CASE WHEN wo.id IS NULL THEN 'draft' ELSE 'linked' END,
       psr.required_parts
FROM alerts a
LEFT JOIN predictive_schedule_recommendations psr ON psr.equipment_id = a.equipment_id
LEFT JOIN work_orders wo ON wo.equipment_id = a.equipment_id
WHERE a.id <= 15;

INSERT INTO work_order_checklists (generated_work_order_id, step_number, checklist_item, required, status)
SELECT id, 1, 'Verify lockout/tagout and safe asset state before work begins.', TRUE, 'pending' FROM generated_work_orders
UNION ALL
SELECT id, 2, 'Inspect predicted failure component and capture readings/photos.', TRUE, 'pending' FROM generated_work_orders
UNION ALL
SELECT id, 3, 'Replace or adjust recommended parts and record actual condition.', TRUE, 'pending' FROM generated_work_orders;

-- Feature Expansion Plan: Parts Inventory Forecasting
INSERT INTO parts_forecasts (spare_part_id, forecast_period, forecast_quantity, confidence, stockout_risk, vendor_lead_days)
SELECT id, 'next_30_days', GREATEST(1, min_quantity + (id % 6)), 70 + (id % 25),
       CASE WHEN quantity < min_quantity THEN 'critical' WHEN quantity <= min_quantity + 1 THEN 'high' ELSE 'medium' END,
       5 + (id % 18)
FROM spare_parts
WHERE id <= 15;

INSERT INTO parts_reorder_recommendations (forecast_id, recommended_quantity, reorder_point, urgency, estimated_cost, rationale, status)
SELECT pf.id,
       GREATEST(pf.forecast_quantity, sp.min_quantity * 2),
       sp.min_quantity,
       pf.stockout_risk,
       GREATEST(pf.forecast_quantity, sp.min_quantity * 2) * sp.unit_cost,
       'Recommendation considers forecast demand, current inventory, minimum quantity, vendor lead time, and stockout risk.',
       CASE WHEN pf.stockout_risk IN ('critical', 'high') THEN 'recommended' ELSE 'watchlist' END
FROM parts_forecasts pf
JOIN spare_parts sp ON sp.id = pf.spare_part_id;

-- Feature Expansion Plan: Technician Mobile Checklist
INSERT INTO technician_checklists (work_order_id, technician, mobile_status, offline_sync_status, signature_name, signed_at, notes)
SELECT id, assigned_to,
       CASE WHEN status = 'completed' THEN 'completed' WHEN status = 'in_progress' THEN 'in_progress' ELSE 'assigned' END,
       CASE WHEN id % 5 = 0 THEN 'queued_offline' ELSE 'synced' END,
       CASE WHEN status = 'completed' THEN assigned_to ELSE NULL END,
       CASE WHEN status = 'completed' THEN completed_at ELSE NULL END,
       'Mobile checklist supports photo proof, notes, signature, and offline sync.'
FROM work_orders;

INSERT INTO technician_checklist_items (checklist_id, step_number, task, status, photo_required, notes, completed_at)
SELECT id, 1, 'Confirm asset ID, safety state, and work order scope.', CASE WHEN mobile_status = 'completed' THEN 'completed' ELSE 'pending' END, FALSE, 'Asset and scope verification step.', signed_at FROM technician_checklists
UNION ALL
SELECT id, 2, 'Capture before-service photo and diagnostic reading.', CASE WHEN mobile_status = 'completed' THEN 'completed' ELSE 'pending' END, TRUE, 'Photo proof required for field evidence.', signed_at FROM technician_checklists
UNION ALL
SELECT id, 3, 'Record corrective action, parts used, and final reading.', CASE WHEN mobile_status = 'completed' THEN 'completed' ELSE 'pending' END, TRUE, 'Completion notes feed maintenance history.', signed_at FROM technician_checklists;

INSERT INTO field_uploads (checklist_id, upload_type, file_url, caption)
SELECT id, CASE WHEN id % 2 = 0 THEN 'photo' ELSE 'signature' END,
       '/field-uploads/checklist-' || id || '.jpg',
       'Field evidence captured from technician mobile workflow.'
FROM technician_checklists
WHERE id <= 15;

INSERT INTO push_subscriptions (user_id, provider, device_token, platform)
SELECT id,
       CASE WHEN id % 2 = 0 THEN 'onesignal' ELSE 'firebase' END,
       'demo-device-token-' || id,
       CASE WHEN id % 3 = 0 THEN 'android' WHEN id % 3 = 1 THEN 'ios' ELSE 'web' END
FROM users
WHERE id <= 15;

INSERT INTO procurement_orders (recommendation_id, spare_part_id, supplier, quantity, estimated_cost, status, created_by)
SELECT prr.id, pf.spare_part_id, sp.supplier, prr.recommended_quantity, prr.estimated_cost,
       CASE WHEN prr.urgency IN ('critical', 'high') THEN 'ready_to_dispatch' ELSE 'draft' END,
       'system'
FROM parts_reorder_recommendations prr
JOIN parts_forecasts pf ON pf.id = prr.forecast_id
JOIN spare_parts sp ON sp.id = pf.spare_part_id
WHERE prr.id <= 15;

INSERT INTO integration_events (integration_type, provider, operation, request_payload, response_payload, status)
VALUES
('cmms', 'maximo', 'sync_work_orders', '{"mode":"seed"}', '{"message":"Ready when credentials are configured"}', 'configured_pending'),
('iot', 'aws_iot', 'ingest_batch', '{"mode":"seed"}', '{"message":"Webhook ingestion enabled"}', 'configured_pending'),
('push', 'onesignal', 'send_notification', '{"mode":"seed"}', '{"message":"Ready when credentials are configured"}', 'configured_pending'),
('procurement', 'generic_http', 'dispatch_order', '{"mode":"seed"}', '{"message":"Ready when PROCUREMENT_API_URL is configured"}', 'configured_pending');
