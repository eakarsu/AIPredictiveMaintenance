import React, { useState, useEffect } from 'react';
import { FiActivity, FiUpload, FiRefreshCw } from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { getAll } from '../services/api';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#1a73e8', '#00e676', '#ffc107', '#ff5252', '#ab47bc', '#26c6da'];

const SensorChart = () => {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [sensors, setSensors] = useState([]);
  const [readings, setReadings] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [ingestData, setIngestData] = useState({ vibration: '', temperature: '', pressure: '', current_draw: '' });
  const [ingestMsg, setIngestMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAll('equipment');
        const items = res.data.data || res.data || [];
        setEquipment(Array.isArray(items) ? items : []);
      } catch (err) { console.error(err); }
      finally { setPageLoading(false); }
    };
    load();
  }, []);

  const loadSensorData = async (equipmentId) => {
    if (!equipmentId) return;
    setLoading(true);
    try {
      const res = await getAll('sensors', { equipment_id: equipmentId });
      const sensorList = res.data.data || res.data || [];
      setSensors(Array.isArray(sensorList) ? sensorList : []);

      const readingMap = {};
      for (const sensor of (Array.isArray(sensorList) ? sensorList : [])) {
        try {
          const rRes = await api.get(`/sensor-readings?sensor_id=${sensor.id}&limit=50`);
          const rData = rRes.data.data || rRes.data || [];
          readingMap[sensor.id] = Array.isArray(rData) ? rData.reverse() : [];
        } catch (_) { readingMap[sensor.id] = []; }
      }
      setReadings(readingMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleEquipmentChange = (id) => {
    setSelectedEquipmentId(id);
    setSensors([]);
    setReadings({});
    if (id) loadSensorData(id);
  };

  const handleIngest = async () => {
    try {
      setIngestMsg('');
      const payload = {};
      if (ingestData.vibration) payload.vibration = parseFloat(ingestData.vibration);
      if (ingestData.temperature) payload.temperature = parseFloat(ingestData.temperature);
      if (ingestData.pressure) payload.pressure = parseFloat(ingestData.pressure);
      if (ingestData.current_draw) payload.current_draw = parseFloat(ingestData.current_draw);
      payload.timestamp = new Date().toISOString();

      const res = await api.post(`/equipment/${selectedEquipmentId}/sensor-data`, payload);
      setIngestMsg(`Data ingested. ${res.data.data?.alerts_created?.length || 0} alert(s) created.`);
      loadSensorData(selectedEquipmentId);
    } catch (err) {
      setIngestMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiActivity style={{ marginRight: 10 }} />Sensor Charts</div>
          <div className="page-subtitle">Real-time sensor readings and data ingestion</div>
        </div>
      </div>

      {/* Equipment selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>Select Equipment</label>
            <select
              value={selectedEquipmentId}
              onChange={e => handleEquipmentChange(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 }}
            >
              <option value="">Choose equipment...</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} — {eq.type}</option>
              ))}
            </select>
          </div>
          {selectedEquipmentId && (
            <button className="btn-secondary" onClick={() => loadSensorData(selectedEquipmentId)} style={{ marginBottom: 2 }}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Sensor data ingest */}
      {selectedEquipmentId && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiUpload size={16} color="#1a73e8" /> Ingest Sensor Reading
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
            {['vibration', 'temperature', 'pressure', 'current_draw'].map(field => (
              <div key={field}>
                <label style={{ display: 'block', fontSize: 12, color: '#8899aa', marginBottom: 6, textTransform: 'capitalize' }}>
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ingestData[field]}
                  onChange={e => setIngestData(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder="e.g. 42.5"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-primary" onClick={handleIngest}>
              <FiUpload size={14} /> Ingest Data
            </button>
            {ingestMsg && (
              <span style={{ fontSize: 13, color: ingestMsg.startsWith('Error') ? '#ff5252' : '#00e676' }}>{ingestMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      {loading && <LoadingSpinner />}

      {!loading && sensors.length > 0 && sensors.map((sensor, idx) => {
        const sensorReadings = readings[sensor.id] || [];
        const chartData = sensorReadings.map(r => ({
          time: new Date(r.timestamp).toLocaleTimeString(),
          value: parseFloat(r.value),
          is_anomaly: r.is_anomaly,
        }));

        return (
          <div key={sensor.id} className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              {sensor.name} <span style={{ fontSize: 12, color: '#607d8b', fontWeight: 400 }}>({sensor.type})</span>
            </div>
            <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 16 }}>
              Unit: {sensor.unit || '--'} | Min: {sensor.min_threshold || '--'} | Max: {sensor.max_threshold || '--'} | Last: {sensor.last_reading || '--'}
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis dataKey="time" tick={{ fill: '#607d8b', fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#607d8b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111a24', border: '1px solid #2a3a4a', borderRadius: 8, color: '#e0e0e0' }}
                  />
                  {sensor.max_threshold && (
                    <ReferenceLine y={parseFloat(sensor.max_threshold)} stroke="#ff5252" strokeDasharray="4 2" label={{ value: 'Max', fill: '#ff5252', fontSize: 10 }} />
                  )}
                  {sensor.min_threshold && (
                    <ReferenceLine y={parseFloat(sensor.min_threshold)} stroke="#ffc107" strokeDasharray="4 2" label={{ value: 'Min', fill: '#ffc107', fontSize: 10 }} />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.is_anomaly) return <circle key={cx} cx={cx} cy={cy} r={5} fill="#ff5252" stroke="#fff" strokeWidth={1.5} />;
                      return null;
                    }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#607d8b', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No readings available</div>
            )}
          </div>
        );
      })}

      {!loading && selectedEquipmentId && sensors.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#607d8b', padding: 40 }}>
          No sensors configured for this equipment.
        </div>
      )}
    </div>
  );
};

export default SensorChart;
