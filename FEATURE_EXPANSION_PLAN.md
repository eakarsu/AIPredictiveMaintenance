# Feature Expansion Plan

Target product: Industrial Maintenance / IoT Anomaly Platform

## 1. Asset Registry
- Add richer asset hierarchy, location, criticality, warranty, downtime cost, and spare part mappings.
- Backend tables: `asset_hierarchy`, `asset_criticality`, `asset_warranty`.
- UI entry points: Equipment, Equipment Health.

## 2. Sensor Ingestion
- Add stream/batch ingestion for vibration, temperature, pressure, runtime, energy, and error codes.
- Backend tables: `sensor_ingestion_batches`, `sensor_quality_events`.
- UI entry points: Sensors, Sensor Chart.

## 3. Anomaly Detection
- Detect outliers, drift, threshold breach, correlated sensor patterns, and early failure signatures.
- Backend tables: `anomaly_events`, `anomaly_explanations`.
- UI entry points: Anomaly Detection, Alerts.

## 4. Predictive Maintenance Scheduling
- Recommend maintenance windows based on failure probability, production schedule, labor, and parts.
- Backend tables: `predictive_schedule_recommendations`, `maintenance_window_constraints`.
- UI entry points: Maintenance Schedules, Maintenance Window Planner.

## 5. Work Order Generation
- Create work orders from alerts and recommendations with checklist, priority, asset context, and parts.
- Backend tables: `generated_work_orders`, `work_order_checklists`.
- UI entry points: Work Orders, Maintenance Recommendation.

## 6. Parts Inventory Forecasting
- Forecast spare-part demand, reorder points, vendor lead times, and stockout risk.
- Backend tables: `parts_forecasts`, `parts_reorder_recommendations`.
- UI entry points: Spare Parts, Parts Optimizer.

## 7. Downtime Cost Dashboard
- Show avoided downtime, cost exposure, maintenance ROI, OEE impact, and asset-level loss risk.
- Backend views: `downtime_cost_metrics`, `maintenance_roi_metrics`.
- UI entry points: Cost Analysis, Maintenance ROI.

## 8. Technician Mobile Checklist
- Add mobile-oriented checklist for field techs with photo proof, notes, signatures, and offline queue.
- Backend tables: `technician_checklists`, `technician_checklist_items`, `field_uploads`.
- UI entry points: Work Orders, Maintenance Logs.
