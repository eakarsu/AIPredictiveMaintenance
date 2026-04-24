import React, { useState, useEffect } from 'react';
import { FiZap, FiPlay } from 'react-icons/fi';
import { getAll } from '../services/api';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const AnomalyDetection = () => {
  const [sensors, setSensors] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAll('sensors');
        const items = res.data.data || res.data || [];
        setSensors(Array.isArray(items) ? items : []);
      } catch (err) { console.error(err); }
      finally { setPageLoading(false); }
    };
    load();
  }, []);

  const detectAnomalies = async () => {
    if (!selectedId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/anomaly-detection', { sensor_id: selectedId });
      const d = res.data.data || res.data;
      setResult(d.analysis || d.result || d.anomalies || d);
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  const selectedSensor = sensors.find(s => (s.id) === selectedId);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiZap style={{ marginRight: 10 }} />Anomaly Detection</div>
          <div className="page-subtitle">AI-powered anomaly detection for sensor data</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#8899aa', marginBottom: 8 }}>
              Select Sensor
            </label>
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setResult(null); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1px solid #2a3a4a', backgroundColor: '#0f1923',
                color: '#e0e0e0', fontSize: 14, outline: 'none',
              }}
            >
              <option value="">Choose sensor...</option>
              {sensors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type}) - {s.currentValue || '--'} {s.unit || ''}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={detectAnomalies}
            disabled={!selectedId || loading}
            style={{ marginTop: 24, opacity: !selectedId || loading ? 0.5 : 1 }}
          >
            <FiPlay size={16} /> Detect Anomalies
          </button>
        </div>

        {selectedSensor && (
          <div style={{
            marginTop: 16, padding: 16, backgroundColor: '#0f1923',
            borderRadius: 10, display: 'flex', gap: 24, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>SENSOR</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>{selectedSensor.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>TYPE</div>
              <div style={{ fontSize: 14, color: '#c0d0e0', textTransform: 'capitalize' }}>{selectedSensor.type}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>CURRENT VALUE</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {selectedSensor.currentValue || '--'} {selectedSensor.unit || ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>THRESHOLDS</div>
              <div style={{ fontSize: 14, color: '#c0d0e0' }}>
                {selectedSensor.min_threshold || '--'} - {selectedSensor.max_threshold || '--'} {selectedSensor.unit || ''}
              </div>
            </div>
          </div>
        )}
      </div>

      {(loading || result) && (
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiZap size={18} color="#ffc107" /> Anomaly Detection Results
          </div>
          <AIResultDisplay result={result} loading={loading} />
        </div>
      )}
    </div>
  );
};

export default AnomalyDetection;
