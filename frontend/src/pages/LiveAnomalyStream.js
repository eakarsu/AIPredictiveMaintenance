import React, { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiRadio, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';

const badge = (value) => ({
  display: 'inline-flex',
  padding: '3px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  color: value === 'critical' ? '#ff8a8a' : value === 'high' ? '#ffd166' : '#8fd19e',
  background: value === 'critical' ? '#ff525222' : value === 'high' ? '#ffc10722' : '#4caf5022',
});

const LiveAnomalyStream = () => {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:3001/api', []);

  const loadRecent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/streams/anomalies/recent?token=${encodeURIComponent(token || '')}`);
      setEvents(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load recent anomaly events');
    }
  };

  useEffect(() => {
    loadRecent();
    const token = localStorage.getItem('token');
    if (!token) return undefined;
    const source = new EventSource(`${apiBase}/streams/anomalies?token=${encodeURIComponent(token)}`);

    source.addEventListener('open', () => {
      setConnected(true);
      setError('');
    });
    source.addEventListener('snapshot', (message) => {
      const rows = JSON.parse(message.data || '[]');
      setEvents(rows);
    });
    source.addEventListener('anomaly', (message) => {
      const row = JSON.parse(message.data);
      setEvents((current) => [row, ...current].slice(0, 100));
    });
    source.addEventListener('error', () => {
      setConnected(false);
      setError('Live stream disconnected. Recent events remain available.');
    });

    return () => source.close();
  }, [apiBase]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiRadio style={{ marginRight: 10 }} /> Live Anomaly Stream</div>
          <div className="page-subtitle">Server-sent anomaly feed from IoT ingestion and threshold monitoring.</div>
        </div>
        <button className="btn-secondary" onClick={loadRecent}><FiRefreshCw /> Refresh</button>
      </div>

      <div className="cards-grid">
        <div className="card">
          <div style={{ color: '#8fa1b3', fontSize: 12 }}>Connection</div>
          <div style={{ color: connected ? '#8fd19e' : '#ffd166', fontWeight: 800, marginTop: 6 }}>
            {connected ? 'Live' : 'Waiting'}
          </div>
        </div>
        <div className="card">
          <div style={{ color: '#8fa1b3', fontSize: 12 }}>Events Loaded</div>
          <div style={{ color: '#fff', fontWeight: 800, marginTop: 6 }}>{events.length}</div>
        </div>
      </div>

      {error && <div className="card" style={{ color: '#ffd166', marginBottom: 16 }}>{error}</div>}

      <div className="card">
        {events.length === 0 ? (
          <div style={{ color: '#8fa1b3' }}>No anomaly events yet. Ingest IoT readings above or below sensor thresholds to populate this stream.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {events.map((event) => (
              <div key={`${event.id}-${event.detected_at}`} style={{ background: '#111a24', border: '1px solid #263647', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiActivity color="#1a73e8" />
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700 }}>{event.equipment_name || `Equipment ${event.equipment_id}`}</div>
                      <div style={{ color: '#8fa1b3', fontSize: 12 }}>{event.sensor_name || `Sensor ${event.sensor_id}`} · {event.anomaly_type}</div>
                    </div>
                  </div>
                  <span style={badge(event.severity)}>{event.severity || 'open'}</span>
                </div>
                <div style={{ color: '#cbd5e1', marginTop: 10 }}>{event.summary}</div>
                <div style={{ color: '#607d8b', fontSize: 12, marginTop: 8 }}>{new Date(event.detected_at || Date.now()).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAnomalyStream;
