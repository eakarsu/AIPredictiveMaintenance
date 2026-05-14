import React, { useState, useEffect } from 'react';
import { FiGitBranch, FiPlus, FiTrash2 } from 'react-icons/fi';
import { getAll } from '../services/api';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const WhatIfSimulator = () => {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [simulatedReadings, setSimulatedReadings] = useState([{ metric: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [fetchingEquipment, setFetchingEquipment] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAll('equipment')
      .then(res => {
        const rows = res.data?.data || res.data || [];
        setEquipment(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setEquipment([]))
      .finally(() => setFetchingEquipment(false));
  }, []);

  const addReading = () => {
    setSimulatedReadings(prev => [...prev, { metric: '', value: '' }]);
  };

  const removeReading = (idx) => {
    setSimulatedReadings(prev => prev.filter((_, i) => i !== idx));
  };

  const updateReading = (idx, field, value) => {
    setSimulatedReadings(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEquipment) {
      setError('Please select equipment.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const validReadings = simulatedReadings
        .filter(r => r.metric && r.value !== '')
        .map(r => ({ ...r, value: parseFloat(r.value) }));

      const res = await api.post('/ai/what-if-simulation', {
        equipment_id: parseInt(selectedEquipment),
        simulated_readings: validReadings,
      });
      setResult(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEquipment) return <LoadingSpinner text="Loading equipment..." />;

  const riskColor = (level) => {
    if (!level) return '#607d8b';
    const l = level.toLowerCase();
    if (l === 'critical') return '#ff5252';
    if (l === 'high') return '#ff9800';
    if (l === 'medium') return '#ffc107';
    return '#00e676';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">What-If Simulator</div>
          <div className="page-subtitle">Simulate hypothetical sensor readings and predict failure impact</div>
        </div>
        <span style={{
          padding: '4px 10px', backgroundColor: '#1a73e818', color: '#1a73e8',
          borderRadius: 6, fontSize: 11, fontWeight: 700,
        }}>AI POWERED</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Simulation Parameters</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#607d8b', marginBottom: 6, fontWeight: 600 }}>
              Equipment *
            </label>
            <select
              value={selectedEquipment}
              onChange={e => setSelectedEquipment(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: '#0f1923',
                border: '1px solid #2a3a4a', borderRadius: 8, color: '#e0e0e0', fontSize: 13,
              }}
            >
              <option value="">Select equipment...</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} (Health: {eq.health_score || 0}%)
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#607d8b', fontWeight: 600 }}>Simulated Sensor Readings</label>
              <button
                type="button"
                onClick={addReading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                  backgroundColor: '#1a73e818', color: '#1a73e8', border: '1px solid #1a73e8',
                  borderRadius: 6, cursor: 'pointer', fontSize: 12,
                }}
              >
                <FiPlus size={12} /> Add Reading
              </button>
            </div>
            {simulatedReadings.map((r, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Metric name (e.g. temperature, vibration)"
                  value={r.metric}
                  onChange={e => updateReading(idx, 'metric', e.target.value)}
                  style={{
                    flex: 2, padding: '8px 12px', backgroundColor: '#0f1923',
                    border: '1px solid #2a3a4a', borderRadius: 8, color: '#e0e0e0', fontSize: 13,
                  }}
                />
                <input
                  type="number"
                  placeholder="Value"
                  value={r.value}
                  onChange={e => updateReading(idx, 'value', e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', backgroundColor: '#0f1923',
                    border: '1px solid #2a3a4a', borderRadius: 8, color: '#e0e0e0', fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeReading(idx)}
                  disabled={simulatedReadings.length === 1}
                  style={{
                    padding: '8px 10px', backgroundColor: '#ff525218', color: '#ff5252',
                    border: '1px solid #ff5252', borderRadius: 8, cursor: 'pointer',
                    opacity: simulatedReadings.length === 1 ? 0.4 : 1,
                  }}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ color: '#ff5252', fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px', backgroundColor: '#1a73e8', color: '#fff',
              border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <FiGitBranch size={15} />
            {loading ? 'Running Simulation...' : 'Run What-If Simulation'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#1a73e8' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>AI is running simulation...</div>
          <LoadingSpinner />
        </div>
      )}

      {result && !loading && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Actual */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#8899aa', marginBottom: 12 }}>Actual Prediction</div>
              {result.comparison?.actual_prediction ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 700, color: riskColor(result.comparison.actual_prediction.risk_level) }}>
                    {result.comparison.actual_prediction.risk_level?.toUpperCase() || 'N/A'}
                  </div>
                  <div style={{ fontSize: 13, color: '#8899aa', marginTop: 4 }}>
                    Health Score: {result.comparison.actual_prediction.health_score || 'N/A'}%
                  </div>
                  {(result.comparison.actual_prediction.key_findings || []).map((f, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#c0d0e0', marginTop: 6 }}>• {f}</div>
                  ))}
                </>
              ) : <div style={{ color: '#607d8b', fontSize: 13 }}>No data</div>}
            </div>

            {/* Simulated */}
            <div className="card" style={{ border: '1px solid #1a73e8' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a73e8', marginBottom: 12 }}>Simulated Prediction</div>
              {result.comparison?.simulated_prediction ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 700, color: riskColor(result.comparison.simulated_prediction.risk_level) }}>
                    {result.comparison.simulated_prediction.risk_level?.toUpperCase() || 'N/A'}
                  </div>
                  <div style={{ fontSize: 13, color: '#8899aa', marginTop: 4 }}>
                    Health Score: {result.comparison.simulated_prediction.health_score || 'N/A'}%
                  </div>
                  {(result.comparison.simulated_prediction.key_findings || []).map((f, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#c0d0e0', marginTop: 6 }}>• {f}</div>
                  ))}
                </>
              ) : <div style={{ color: '#607d8b', fontSize: 13 }}>No data</div>}
            </div>
          </div>

          {result.comparison?.impact_analysis && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Impact Analysis</div>
              <div style={{ fontSize: 13, color: '#ffc107', marginBottom: 8 }}>
                Risk Delta: {result.comparison.impact_analysis.risk_delta || 'N/A'}
              </div>
              <div style={{ fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
                Health Score Delta: {result.comparison.impact_analysis.health_score_delta !== undefined
                  ? result.comparison.impact_analysis.health_score_delta
                  : 'N/A'}
              </div>
              {(result.comparison.impact_analysis.changes_detected || []).map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: '#c0d0e0', marginTop: 4 }}>• {c}</div>
              ))}
            </div>
          )}

          {result.comparison?.summary && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Summary</div>
              <div style={{ fontSize: 13, color: '#c0d0e0', lineHeight: 1.7 }}>{result.comparison.summary}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatIfSimulator;
