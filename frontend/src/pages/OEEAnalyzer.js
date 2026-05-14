import React, { useState } from 'react';
import { FiBarChart2, FiPlay } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const OEEAnalyzer = () => {
  const [equipmentId, setEquipmentId] = useState('');
  const [availability, setAvailability] = useState('');
  const [performance, setPerformance] = useState('');
  const [quality, setQuality] = useState('');
  const [planned, setPlanned] = useState('');
  const [downtime, setDowntime] = useState('');
  const [reject, setReject] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        equipment_id: equipmentId ? Number(equipmentId) : undefined,
        availability_pct: availability !== '' ? Number(availability) : undefined,
        performance_pct: performance !== '' ? Number(performance) : undefined,
        quality_pct: quality !== '' ? Number(quality) : undefined,
        planned_runtime_hours: planned !== '' ? Number(planned) : undefined,
        unplanned_downtime_hours: downtime !== '' ? Number(downtime) : undefined,
        reject_rate_pct: reject !== '' ? Number(reject) : undefined,
        notes: notes || undefined,
      };
      const res = await api.post('/ai/oee-analyzer', payload);
      setResult(res.data?.data || res.data);
    } catch (err) {
      if (err.response?.status === 503) {
        setError(err.response?.data?.message || 'AI not configured (503). Set OPENROUTER_API_KEY in .env.');
      } else {
        setError(err.response?.data?.message || err.message || 'AI request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.analysis || {};
  const breakdown = parsed?.loss_breakdown || [];
  const counter = parsed?.countermeasures || [];

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 };
  const labelStyle = { display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            <FiBarChart2 style={{ marginRight: 10 }} />
            OEE Analyzer
          </div>
          <div className="page-subtitle">
            Overall Equipment Effectiveness analysis from supplied A / P / Q figures
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleRun}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Equipment ID</label>
              <input type="number" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Availability (%)</label>
              <input type="number" min="0" max="100" value={availability} onChange={(e) => setAvailability(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Performance (%)</label>
              <input type="number" min="0" max="100" value={performance} onChange={(e) => setPerformance(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Quality (%)</label>
              <input type="number" min="0" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Planned Runtime (h)</label>
              <input type="number" value={planned} onChange={(e) => setPlanned(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unplanned Downtime (h)</label>
              <input type="number" value={downtime} onChange={(e) => setDowntime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Reject Rate (%)</label>
              <input type="number" min="0" max="100" value={reject} onChange={(e) => setReject(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'inherit' }} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FiPlay size={14} /> {loading ? 'Analyzing...' : 'Analyze OEE'}
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ background: '#3b1f1f', color: '#fca5a5', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {result && !loading && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>OEE Result</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ background: '#1a73e818', color: '#1a73e8', padding: '12px 20px', borderRadius: 10, fontSize: 24, fontWeight: 700 }}>
                {result.computed_oee_pct ?? parsed.computed_oee_pct ?? '?'}%
              </div>
              {parsed.dominant_loss && (
                <div style={{ alignSelf: 'center', color: '#cbd5e1', fontSize: 13 }}>
                  Dominant loss: <strong style={{ color: '#ffc107' }}>{parsed.dominant_loss}</strong>
                </div>
              )}
              {parsed.world_class_gap_pct !== undefined && (
                <div style={{ alignSelf: 'center', color: '#cbd5e1', fontSize: 13 }}>
                  World-class gap: {parsed.world_class_gap_pct}%
                </div>
              )}
            </div>
            {parsed.summary && <div style={{ marginTop: 12, color: '#cbd5e1', fontSize: 13 }}>{parsed.summary}</div>}
          </div>

          {breakdown.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Loss Breakdown</div>
              {breakdown.map((b, i) => (
                <div key={i} style={{ borderBottom: i < breakdown.length - 1 ? '1px solid #1e2d3d' : 'none', padding: '10px 0', color: '#cbd5e1', fontSize: 13 }}>
                  <strong style={{ color: '#fff' }}>{b.category}: </strong>
                  loss {b.loss_pct}%
                  {b.likely_causes?.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#8899aa' }}>{b.likely_causes.join('; ')}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {counter.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Countermeasures</div>
              {counter.map((c, i) => (
                <div key={i} style={{ borderBottom: i < counter.length - 1 ? '1px solid #1e2d3d' : 'none', padding: '10px 0', color: '#cbd5e1', fontSize: 13 }}>
                  <strong style={{ color: '#fff' }}>[{c.category}] </strong>
                  {c.action}
                  <div style={{ fontSize: 11, color: '#8899aa', marginTop: 4 }}>impact: {c.impact} • effort: {c.effort}</div>
                </div>
              ))}
            </div>
          )}

          {parsed.disclaimer && (
            <div style={{ fontSize: 11, color: '#607d8b', fontStyle: 'italic' }}>{parsed.disclaimer}</div>
          )}
        </>
      )}
    </div>
  );
};

export default OEEAnalyzer;
