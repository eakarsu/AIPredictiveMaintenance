import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiPlay, FiCpu } from 'react-icons/fi';
import { getAll } from '../services/api';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const PredictiveAnalytics = () => {
  const [equipment, setEquipment] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

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

  const runPrediction = async () => {
    if (!selectedId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/ai/predict-failure', { equipment_id: selectedId });
      const data = res.data.data || res.data;
      setResult(data.analysis || data.result || data.prediction || data);
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  const selectedEquip = equipment.find(e => (e.id) === selectedId);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiTrendingUp style={{ marginRight: 10 }} />Predictive Analytics</div>
          <div className="page-subtitle">AI-powered failure prediction for equipment</div>
        </div>
      </div>

      {/* Selection Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#8899aa', marginBottom: 8 }}>
              Select Equipment
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
              <option value="">Choose equipment...</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.type}) - Health: {eq.health_score || 0}%
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={runPrediction}
            disabled={!selectedId || loading}
            style={{ marginTop: 24, opacity: !selectedId || loading ? 0.5 : 1 }}
          >
            <FiPlay size={16} /> Run Prediction
          </button>
        </div>

        {selectedEquip && (
          <div style={{
            marginTop: 16, padding: 16, backgroundColor: '#0f1923',
            borderRadius: 10, display: 'flex', gap: 24, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>EQUIPMENT</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCpu size={14} color="#1a73e8" /> {selectedEquip.name}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>TYPE</div>
              <div style={{ fontSize: 14, color: '#c0d0e0' }}>{selectedEquip.type}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>LOCATION</div>
              <div style={{ fontSize: 14, color: '#c0d0e0' }}>{selectedEquip.location}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#607d8b', marginBottom: 2 }}>HEALTH SCORE</div>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: (selectedEquip.health_score || 0) >= 80 ? '#00e676' : (selectedEquip.health_score || 0) >= 60 ? '#ffc107' : '#ff5252',
              }}>
                {selectedEquip.health_score || 0}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {(loading || result) && (
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiTrendingUp size={18} color="#1a73e8" /> AI Prediction Results
          </div>
          <AIResultDisplay result={result} loading={loading} />
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalytics;
