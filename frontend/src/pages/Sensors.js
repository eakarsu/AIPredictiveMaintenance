import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiActivity, FiThermometer, FiDroplet, FiWind, FiUpload } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const sensorIcons = {
  temperature: FiThermometer,
  vibration: FiActivity,
  pressure: FiDroplet,
  humidity: FiDroplet,
  flow: FiWind,
};

const formFields = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Sensor name' },
  { key: 'type', label: 'Type', required: true, type: 'select', options: [
    { value: 'temperature', label: 'Temperature' }, { value: 'vibration', label: 'Vibration' },
    { value: 'pressure', label: 'Pressure' }, { value: 'humidity', label: 'Humidity' },
    { value: 'flow', label: 'Flow Rate' }, { value: 'power', label: 'Power' },
    { value: 'speed', label: 'Speed' },
  ]},
  { key: 'unit', label: 'Unit', required: true, placeholder: 'e.g. C, PSI, mm/s' },
  { key: 'min_threshold', label: 'Min Threshold', type: 'number', step: 0.1 },
  { key: 'max_threshold', label: 'Max Threshold', type: 'number', step: 0.1 },
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
    { value: 'warning', label: 'Warning' }, { value: 'critical', label: 'Critical' },
  ]},
  { key: 'location', label: 'Location', placeholder: 'Installation location' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

const detailFields = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'unit', label: 'Unit' },
  { key: 'currentValue', label: 'Current Value', render: (v, row) => v != null ? `${v} ${row.unit || ''}` : '-' },
  { key: 'min_threshold', label: 'Min Threshold' },
  { key: 'max_threshold', label: 'Max Threshold' },
  { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  { key: 'location', label: 'Location' },
  { key: 'equipment', label: 'Equipment', render: v => (v && typeof v === 'object') ? v.name : (v || '-') },
  { key: 'last_reading', label: 'Last Reading', render: v => v ? new Date(v).toLocaleString() : '-' },
  { key: 'description', label: 'Description' },
];

const SensorCard = ({ sensor, onClick }) => {
  const Icon = sensorIcons[sensor.type] || FiActivity;
  const statusColor = sensor.status === 'active' ? '#00e676' : sensor.status === 'warning' ? '#ffc107' : sensor.status === 'critical' ? '#ff5252' : '#607d8b';

  return (
    <div
      onClick={() => onClick(sensor)}
      style={{
        backgroundColor: '#1a2332', borderRadius: 14, padding: 20,
        border: '1px solid #2a3a4a', cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = statusColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3a4a'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          backgroundColor: statusColor + '18', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={statusColor} />
        </div>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColor,
          boxShadow: `0 0 8px ${statusColor}66`,
        }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', marginBottom: 4 }}>{sensor.name}</div>
      <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 12, textTransform: 'capitalize' }}>{sensor.type}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        {sensor.currentValue != null ? sensor.currentValue : '--'}
        <span style={{ fontSize: 14, fontWeight: 400, color: '#8899aa', marginLeft: 4 }}>{sensor.unit || ''}</span>
      </div>
      <div style={{ fontSize: 11, color: '#607d8b' }}>
        {sensor.equipment && typeof sensor.equipment === 'object' ? sensor.equipment.name : (sensor.equipmentName || 'Unassigned')}
      </div>
    </div>
  );
};

const Sensors = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showIngest, setShowIngest] = useState(false);
  const [ingestData, setIngestData] = useState({ sensor_id: '', value: '', unit: '' });
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('sensors');
      const items = res.data.data || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCardClick = (sensor) => { setSelected(sensor); setShowDetail(true); };
  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (item) => { setShowDetail(false); setEditing(item); setShowForm(true); };
  const handleDelete = (item) => { setShowDetail(false); setConfirmDelete(item); };

  const handleSubmit = async (formData) => {
    if (editing) {
      await update('sensors', editing.id, formData);
    } else {
      await create('sensors', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('sensors', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const handleIngestSubmit = async (e) => {
    e.preventDefault();
    if (!ingestData.sensor_id || ingestData.value === '') return;
    setIngestLoading(true);
    setIngestResult(null);
    try {
      const res = await api.post('/sensor-readings/ingest', {
        sensor_id: parseInt(ingestData.sensor_id),
        value: parseFloat(ingestData.value),
        unit: ingestData.unit || undefined,
        timestamp: new Date().toISOString(),
      });
      setIngestResult(res.data?.data || res.data);
      await loadData();
    } catch (err) {
      console.error('Ingest error:', err);
    } finally {
      setIngestLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiActivity style={{ marginRight: 10 }} />Sensor Monitoring</div>
          <div className="page-subtitle">{data.length} sensors registered</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => { setShowIngest(!showIngest); setIngestResult(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px' }}
          >
            <FiUpload size={14} /> Ingest Reading
          </button>
          <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> Add New Sensor</button>
        </div>
      </div>

      {/* Ingest Reading Panel */}
      {showIngest && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid #1a73e8' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Ingest Sensor Reading</div>
          <form onSubmit={handleIngestSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#607d8b', marginBottom: 4 }}>Sensor *</label>
              <select
                value={ingestData.sensor_id}
                onChange={e => setIngestData(p => ({ ...p, sensor_id: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f1923', border: '1px solid #2a3a4a', borderRadius: 6, color: '#e0e0e0', fontSize: 13 }}
                required
              >
                <option value="">Select sensor...</option>
                {data.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit || '?'})</option>)}
              </select>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#607d8b', marginBottom: 4 }}>Value *</label>
              <input
                type="number"
                step="any"
                value={ingestData.value}
                onChange={e => setIngestData(p => ({ ...p, value: e.target.value }))}
                placeholder="e.g. 75.3"
                style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f1923', border: '1px solid #2a3a4a', borderRadius: 6, color: '#e0e0e0', fontSize: 13 }}
                required
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#607d8b', marginBottom: 4 }}>Unit</label>
              <input
                type="text"
                value={ingestData.unit}
                onChange={e => setIngestData(p => ({ ...p, unit: e.target.value }))}
                placeholder="e.g. °C"
                style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f1923', border: '1px solid #2a3a4a', borderRadius: 6, color: '#e0e0e0', fontSize: 13 }}
              />
            </div>
            <button
              type="submit"
              disabled={ingestLoading}
              style={{ padding: '9px 18px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              {ingestLoading ? 'Ingesting...' : 'Submit'}
            </button>
          </form>
          {ingestResult && (
            <div style={{ marginTop: 12, fontSize: 12, color: ingestResult.anomalies_detected > 0 ? '#ff9800' : '#00e676' }}>
              {ingestResult.anomalies_detected > 0
                ? `Reading ingested — ANOMALY DETECTED (value outside threshold)`
                : `Reading ingested successfully.`}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {data.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} onClick={handleCardClick} />
        ))}
        {data.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#607d8b' }}>
            No sensors found. Add your first sensor to get started.
          </div>
        )}
      </div>

      <DetailModal
        open={showDetail}
        title={selected?.name || 'Sensor Details'}
        data={selected || {}}
        fields={detailFields}
        onClose={() => setShowDetail(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        open={showForm}
        title={editing ? 'Edit Sensor' : 'Add New Sensor'}
        fields={formFields}
        initialData={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Sensor"
        message={`Are you sure you want to delete "${confirmDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Sensors;
