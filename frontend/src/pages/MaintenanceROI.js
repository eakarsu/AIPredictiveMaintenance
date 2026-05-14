import React, { useState } from 'react';
import { FiDollarSign, FiPlay } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const MaintenanceROI = () => {
  const [equipmentId, setEquipmentId] = useState('');
  const [proposedCost, setProposedCost] = useState('');
  const [reductionPct, setReductionPct] = useState('50');
  const [horizon, setHorizon] = useState('12');
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
        proposed_program_cost: Number(proposedCost) || 0,
        expected_failure_reduction_pct: Number(reductionPct) || 50,
        analysis_horizon_months: Number(horizon) || 12,
      };
      const res = await api.post('/ai/maintenance-roi-calculator', payload);
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
  const breakdown = parsed?.sensitivity || [];
  const assumptions = parsed?.assumptions || [];
  const aggregates = result?.local_aggregates;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            <FiDollarSign style={{ marginRight: 10 }} />
            Maintenance ROI Calculator
          </div>
          <div className="page-subtitle">
            Compares reactive vs preventive program economics for an equipment asset
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleRun} style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 160 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
              Equipment ID
            </label>
            <input type="number" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 }} />
          </div>
          <div style={{ width: 200 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
              Proposed Program Cost ($)
            </label>
            <input type="number" value={proposedCost} onChange={(e) => setProposedCost(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 }} />
          </div>
          <div style={{ width: 200 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
              Failure Reduction (%)
            </label>
            <input type="number" min="0" max="100" value={reductionPct} onChange={(e) => setReductionPct(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 }} />
          </div>
          <div style={{ width: 160 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>
              Horizon (months)
            </label>
            <input type="number" value={horizon} onChange={(e) => setHorizon(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 }} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FiPlay size={14} /> {loading ? 'Calculating...' : 'Calculate ROI'}
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
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>ROI Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <Stat label="Posture" value={parsed.current_posture || '-'} />
              <Stat label="Annual Failure Cost" value={parsed.annualized_failure_cost_estimate ?? '-'} />
              <Stat label="Annual Savings" value={parsed.annualized_savings_estimate ?? '-'} />
              <Stat label="Payback (months)" value={parsed.payback_period_months ?? '-'} />
              <Stat label="ROI %" value={parsed.roi_pct ?? '-'} />
            </div>
            {parsed.recommendation && (
              <div style={{ marginTop: 14, color: '#cbd5e1', fontSize: 13 }}>
                <strong style={{ color: '#fff' }}>Recommendation: </strong>{parsed.recommendation}
              </div>
            )}
          </div>

          {assumptions.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Assumptions</div>
              <ul style={{ color: '#cbd5e1', fontSize: 13, paddingLeft: 20 }}>
                {assumptions.map((a, i) => <li key={i} style={{ marginBottom: 4 }}>{a}</li>)}
              </ul>
            </div>
          )}

          {breakdown.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Sensitivity</div>
              {breakdown.map((b, i) => (
                <div key={i} style={{ borderBottom: i < breakdown.length - 1 ? '1px solid #1e2d3d' : 'none', padding: '10px 0', fontSize: 13, color: '#cbd5e1' }}>
                  <strong style={{ color: '#fff' }}>{b.factor}: </strong>
                  downside — {b.downside}; upside — {b.upside}
                </div>
              ))}
            </div>
          )}

          {aggregates && (
            <div className="card" style={{ marginBottom: 16, fontSize: 12, color: '#8899aa' }}>
              Local aggregates: reactive ${aggregates.totalReactive?.toFixed?.(2) || aggregates.totalReactive}, preventive ${aggregates.totalPreventive?.toFixed?.(2) || aggregates.totalPreventive}
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

const Stat = ({ label, value }) => (
  <div style={{ background: '#0f1923', padding: 12, borderRadius: 8, border: '1px solid #1e2d3d' }}>
    <div style={{ fontSize: 11, color: '#607d8b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 18, color: '#fff', fontWeight: 600, marginTop: 4 }}>{value}</div>
  </div>
);

export default MaintenanceROI;
