import React, { useState } from 'react';
import { FiList, FiPlay } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const WorkOrderPriority = () => {
  const [healthThreshold, setHealthThreshold] = useState(70);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const payload = { health_threshold: Number(healthThreshold) || 70 };
      const res = await api.post('/ai/workorder-priority-optimize', payload);
      setResult(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed || result;
  const ranking = parsed?.ranking || parsed?.ranked || parsed?.work_orders || [];
  const lowHealth = parsed?.low_health_equipment || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            <FiList style={{ marginRight: 10 }} />
            Work Order Priority Optimizer
          </div>
          <div className="page-subtitle">
            AI ranks open work orders against equipment-health snapshots
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleRun} style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 200 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
              Health Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={healthThreshold}
              onChange={(e) => setHealthThreshold(e.target.value)}
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
            <FiPlay size={14} /> {loading ? 'Optimizing...' : 'Optimize Priorities'}
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
          {ranking.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                Ranked Work Orders ({ranking.length})
              </div>
              {ranking.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 0',
                    borderBottom: i < ranking.length - 1 ? '1px solid #1e2d3d' : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#1a73e8' + '18',
                      color: '#1a73e8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                      {r.work_order_id || r.id || r.title || `Work Order ${i + 1}`}
                      {r.suggested_priority && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background:
                              r.suggested_priority === 'critical' || r.suggested_priority === 'high'
                                ? '#ff525222'
                                : '#1a73e822',
                            color:
                              r.suggested_priority === 'critical' || r.suggested_priority === 'high'
                                ? '#ff5252'
                                : '#1a73e8',
                          }}
                        >
                          {r.suggested_priority}
                        </span>
                      )}
                    </div>
                    {r.rationale && (
                      <div style={{ fontSize: 12, color: '#8899aa', marginTop: 4 }}>
                        {r.rationale}
                      </div>
                    )}
                    {r.equipment && (
                      <div style={{ fontSize: 11, color: '#607d8b', marginTop: 2 }}>
                        Equipment: {r.equipment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowHealth.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#ffc107', marginBottom: 12 }}>
                Low-Health Equipment Snapshot
              </div>
              {lowHealth.map((e, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    color: '#cbd5e1',
                    padding: '6px 0',
                    borderBottom: i < lowHealth.length - 1 ? '1px solid #1e2d3d' : 'none',
                  }}
                >
                  {typeof e === 'string' ? e : (
                    <>
                      <strong>{e.name || e.id || `Equipment ${i + 1}`}: </strong>
                      health {e.health_score ?? e.score ?? '-'}%
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

export default WorkOrderPriority;
