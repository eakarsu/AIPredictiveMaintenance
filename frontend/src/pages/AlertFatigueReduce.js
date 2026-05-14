import React, { useState, useEffect } from 'react';
import { FiBellOff, FiPlay } from 'react-icons/fi';
import { getAll } from '../services/api';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AlertFatigueReduce = () => {
  const [equipment, setEquipment] = useState([]);
  const [equipmentId, setEquipmentId] = useState('');
  const [hours, setHours] = useState(24);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAll('equipment')
      .then((res) => {
        const items = res.data.data || res.data || [];
        setEquipment(Array.isArray(items) ? items : []);
      })
      .catch(() => {});
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const payload = { hours: Number(hours) || 24 };
      if (equipmentId) payload.equipment_id = equipmentId;
      const res = await api.post('/ai/alert-fatigue-reduce', payload);
      setResult(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed || result;
  const clusters = parsed?.clusters || [];
  const suppressible = parsed?.suppressible || parsed?.can_suppress || [];
  const mustAct = parsed?.must_action || parsed?.must_act || parsed?.priority || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            <FiBellOff style={{ marginRight: 10 }} />
            Alert Fatigue Reducer
          </div>
          <div className="page-subtitle">Cluster recent alerts; identify suppressible vs must-action</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleRun} style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
              Equipment (optional)
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #2a3a4a',
                backgroundColor: '#0f1923',
                color: '#e0e0e0',
                fontSize: 14,
              }}
            >
              <option value="">All equipment</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} — {eq.type}
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: 140 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
              Window (hours)
            </label>
            <input
              type="number"
              min="1"
              max="720"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #2a3a4a',
                backgroundColor: '#0f1923',
                color: '#e0e0e0',
                fontSize: 14,
              }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FiPlay size={14} /> {loading ? 'Analyzing...' : 'Reduce Fatigue'}
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ background: '#3b1f1f', color: '#fca5a5', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {parsed && !loading && (
        <>
          {parsed.fatigue_score !== undefined && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 4 }}>Fatigue Score</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#ff5252' }}>
                {parsed.fatigue_score}
              </div>
            </div>
          )}

          {clusters.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                Clusters ({clusters.length})
              </div>
              {clusters.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 0',
                    borderBottom: i < clusters.length - 1 ? '1px solid #1e2d3d' : 'none',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                    {c.name || c.cluster || `Cluster ${i + 1}`}
                  </div>
                  {c.description && (
                    <div style={{ fontSize: 12, color: '#8899aa', marginTop: 4 }}>{c.description}</div>
                  )}
                  {c.alert_count !== undefined && (
                    <div style={{ fontSize: 11, color: '#607d8b', marginTop: 2 }}>
                      Alerts: {c.alert_count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {suppressible.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#00e676', marginBottom: 12 }}>
                Suppressible
              </div>
              {suppressible.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: '#cbd5e1',
                    padding: '6px 0',
                    borderBottom: i < suppressible.length - 1 ? '1px solid #1e2d3d' : 'none',
                  }}
                >
                  {typeof s === 'string' ? s : (
                    <>
                      <strong>{s.id || s.alert_id || `Alert ${i + 1}`}: </strong>
                      {s.reason || s.description || ''}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {mustAct.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#ff5252', marginBottom: 12 }}>
                Must Action
              </div>
              {mustAct.map((m, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: '#fca5a5',
                    padding: '6px 0',
                    borderBottom: i < mustAct.length - 1 ? '1px solid #1e2d3d' : 'none',
                  }}
                >
                  {typeof m === 'string' ? m : (
                    <>
                      <strong>{m.id || m.alert_id || `Alert ${i + 1}`}: </strong>
                      {m.reason || m.action || m.description || ''}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlertFatigueReduce;
