import React, { useEffect, useMemo, useState } from 'react';
import { FiDatabase } from 'react-icons/fi';
import api from '../services/api';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

const configs = {
  'asset-registry': {
    title: 'Asset Registry',
    description: 'Asset hierarchy, location, criticality, warranty, downtime cost, and risk context.',
    columns: [
      ['equipment_name', 'Equipment'],
      ['equipment_type', 'Type'],
      ['asset_path', 'Asset Path'],
      ['criticality_score', 'Criticality'],
      ['downtime_cost_per_hour', 'Downtime / Hr', 'money'],
      ['risk_category', 'Risk'],
      ['claim_status', 'Warranty'],
    ],
  },
  'sensor-ingestion': {
    title: 'Sensor Ingestion',
    description: 'Stream and batch ingestion batches with quality events for IoT data pipelines.',
    columns: [
      ['source_system', 'Source'],
      ['batch_type', 'Type'],
      ['reading_count', 'Readings'],
      ['accepted_count', 'Accepted'],
      ['rejected_count', 'Rejected'],
      ['status', 'Status'],
      ['quality_event_count', 'Quality Events'],
    ],
  },
  'anomaly-events': {
    title: 'Anomaly Events',
    description: 'Outliers, drift, threshold breaches, correlated patterns, and early failure signatures.',
    columns: [
      ['equipment_name', 'Equipment'],
      ['sensor_name', 'Sensor'],
      ['anomaly_type', 'Type'],
      ['severity', 'Severity'],
      ['score', 'Score'],
      ['status', 'Status'],
      ['detected_at', 'Detected', 'datetime'],
    ],
  },
  'predictive-scheduling': {
    title: 'Predictive Scheduling',
    description: 'Maintenance windows based on failure probability, production constraints, labor, and parts.',
    columns: [
      ['equipment_name', 'Equipment'],
      ['failure_probability', 'Failure %'],
      ['priority', 'Priority'],
      ['recommended_window_start', 'Window Start', 'datetime'],
      ['labor_hours', 'Labor Hrs'],
      ['status', 'Status'],
      ['constraint_count', 'Constraints'],
    ],
  },
  'generated-work-orders': {
    title: 'Generated Work Orders',
    description: 'Work orders generated from alerts and predictive recommendations with checklist context.',
    columns: [
      ['equipment_name', 'Equipment'],
      ['work_order_title', 'Linked Work Order'],
      ['priority', 'Priority'],
      ['status', 'Status'],
      ['parts_context', 'Parts'],
      ['checklist_count', 'Checklist Steps'],
    ],
  },
  'parts-forecasting': {
    title: 'Parts Forecasting',
    description: 'Spare-part demand forecasts, reorder points, lead times, and stockout risk.',
    columns: [
      ['part_name', 'Part'],
      ['part_number', 'Part #'],
      ['current_quantity', 'On Hand'],
      ['forecast_quantity', 'Forecast'],
      ['stockout_risk', 'Risk'],
      ['recommended_quantity', 'Reorder Qty'],
      ['estimated_cost', 'Cost', 'money'],
    ],
  },
  'downtime-roi': {
    title: 'Downtime & ROI Metrics',
    description: 'Avoided downtime, cost exposure, maintenance spend, ROI, and asset-level loss risk.',
    columns: [
      ['equipment_name', 'Equipment'],
      ['health_score', 'Health'],
      ['active_alerts', 'Alerts'],
      ['open_work_orders', 'Open WOs'],
      ['cost_exposure', 'Exposure', 'money'],
      ['maintenance_spend', 'Maint. Spend', 'money'],
      ['estimated_avoided_loss', 'Avoided Loss', 'money'],
    ],
  },
  'technician-checklists': {
    title: 'Technician Checklists',
    description: 'Mobile field checklists with photo proof, notes, signatures, and offline queue status.',
    columns: [
      ['work_order_title', 'Work Order'],
      ['equipment_name', 'Equipment'],
      ['technician', 'Technician'],
      ['mobile_status', 'Mobile Status'],
      ['offline_sync_status', 'Sync'],
      ['item_count', 'Items'],
      ['upload_count', 'Uploads'],
    ],
  },
};

const childLabels = {
  quality_events: 'Quality Events',
  explanations: 'Explanations',
  constraints: 'Window Constraints',
  checklist: 'Checklist Steps',
  items: 'Checklist Items',
  field_uploads: 'Field Uploads',
};

const pageStyle = { display: 'flex', flexDirection: 'column', gap: 24 };
const headerStyle = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 };
const titleStyle = { margin: 0, fontSize: 28, color: '#e8f1f8' };
const subtitleStyle = { margin: '6px 0 0', color: '#8fa1b3', maxWidth: 780 };
const cardStyle = { backgroundColor: '#1a2332', border: '1px solid #2a3a4a', borderRadius: 14, padding: 18 };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 };
const modalStyle = { ...cardStyle, width: 'min(980px, 96vw)', maxHeight: '86vh', overflowY: 'auto' };
const detailGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 };
const detailItem = { background: '#111a24', border: '1px solid #263647', borderRadius: 10, padding: 12 };
const labelStyle = { color: '#8fa1b3', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 };
const valueStyle = { color: '#e8f1f8', fontSize: 14, overflowWrap: 'anywhere' };

const formatLabel = (key) => key.replace(/_/g, ' ');
const formatValue = (key, value) => {
  if (value == null) return '-';
  if (key.includes('date') || key.includes('_at') || key.includes('window_')) return new Date(value).toLocaleString();
  if (key.includes('cost') || key.includes('spend') || key.includes('loss')) return `$${Number(value).toLocaleString()}`;
  return String(value);
};

const renderCell = (type) => (value) => {
  if (value == null) return '-';
  if (type === 'money') return `$${Number(value).toLocaleString()}`;
  if (type === 'datetime') return new Date(value).toLocaleString();
  return String(value);
};

const FeatureExpansionPage = ({ feature }) => {
  const config = configs[feature];
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/feature-expansion/${feature}`);
        setRows(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load feature data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [feature]);

  const columns = useMemo(() => config.columns.map(([accessor, header, type]) => ({
    accessor,
    header,
    render: renderCell(type),
  })), [config]);

  const openDetail = async (row) => {
    try {
      const id = feature === 'downtime-roi' ? row.equipment_id : row.id;
      const res = await api.get(`/feature-expansion/${feature}/${id}`);
      setDetail(res.data.data);
    } catch (err) {
      setDetail(row);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{config.title}</h1>
          <p style={subtitleStyle}>{config.description}</p>
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiDatabase color="#1a73e8" />
          <div>
            <div style={{ color: '#e8f1f8', fontWeight: 700 }}>{rows.length}</div>
            <div style={{ color: '#8fa1b3', fontSize: 12 }}>records</div>
          </div>
        </div>
      </div>

      {error && <div style={{ ...cardStyle, color: '#ff8a8a' }}>{error}</div>}

      <DataTable columns={columns} data={rows} onRowClick={openDetail} />

      {detail && (
        <div style={modalOverlay} onClick={() => setDetail(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, color: '#e8f1f8' }}>{detail.equipment_name || detail.part_name || detail.source_system || detail.work_order_title || config.title}</h2>
                <p style={{ margin: '4px 0 0', color: '#8fa1b3' }}>Detailed record and related operational evidence</p>
              </div>
              <button className="btn-secondary" onClick={() => setDetail(null)}>Close</button>
            </div>

            <div style={detailGrid}>
              {Object.entries(detail).filter(([key]) => key !== 'children').map(([key, value]) => (
                <div style={detailItem} key={key}>
                  <div style={labelStyle}>{formatLabel(key)}</div>
                  <div style={valueStyle}>{typeof value === 'object' && value !== null ? 'See related records below' : formatValue(key, value)}</div>
                </div>
              ))}
            </div>

            {Object.entries(detail.children || {}).map(([key, childRows]) => (
              <div style={{ marginTop: 22 }} key={key}>
                <h3 style={{ color: '#e8f1f8', marginBottom: 12 }}>{childLabels[key] || formatLabel(key)}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {childRows.map((child) => (
                    <div style={detailItem} key={`${key}-${child.id}`}>
                      {Object.entries(child).filter(([childKey]) => childKey !== 'id').map(([childKey, childValue]) => (
                        <div key={childKey} style={{ marginBottom: 8 }}>
                          <div style={labelStyle}>{formatLabel(childKey)}</div>
                          <div style={valueStyle}>{formatValue(childKey, childValue)}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureExpansionPage;
