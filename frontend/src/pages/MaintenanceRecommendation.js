import React, { useState, useEffect } from 'react';
import { FiTool, FiPlay, FiAlertTriangle } from 'react-icons/fi';
import api, { getAll } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Frontend for POST /api/ai/maintenance-recommendation
// Pulls available equipment, lets user pick one, and renders the AI response.
const MaintenanceRecommendation = () => {
  const [equipment, setEquipment] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAll('equipment');
        const items = res.data?.data || res.data || [];
        setEquipment(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const run = async () => {
    if (!selectedId) {
      setError('Please select equipment first');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      // JWT is attached automatically via api interceptor reading localStorage.getItem('token')
      const res = await api.post('/ai/maintenance-recommendation', { equipment_id: selectedId });
      setResult(res.data?.data?.recommendations || res.data?.data || res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (status === 503) {
        setError('AI service unavailable: OPENROUTER_API_KEY is not configured on the backend (503).');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const fmtCurrency = (v) => v == null ? '-' : '$' + Number(v).toLocaleString('en-US');

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ padding: 24 }}>
      <div className="flex items-center justify-between mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiTool size={28} color="#1a73e8" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111a24', margin: 0 }}>Maintenance Recommendation</h1>
            <p style={{ color: '#607d8b', fontSize: 13, margin: 0 }}>AI-optimized maintenance strategy and priority actions per equipment</p>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12,
        padding: 20, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#37474f', marginBottom: 6 }}>Equipment</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #cfd8dc',
              borderRadius: 8, fontSize: 14, background: '#fff'
            }}
          >
            <option value="">Select equipment…</option>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>{e.name || `Equipment #${e.id}`}</option>
            ))}
          </select>
        </div>
        <button
          onClick={run}
          disabled={loading || !selectedId}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: '#1a73e8', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !selectedId ? 0.6 : 1,
          }}
        >
          <FiPlay size={14} />
          {loading ? 'Analyzing…' : 'Get Recommendations'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <LoadingSpinner size="lg" />
          <p style={{ marginTop: 16, color: '#607d8b' }}>Analyzing maintenance history, schedules and sensor data…</p>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          padding: 14, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16
        }}>
          <FiAlertTriangle /> <span>{error}</span>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result.maintenance_strategy && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#607d8b', margin: 0, marginBottom: 6 }}>Recommended Strategy</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#1a73e8', margin: 0, textTransform: 'capitalize' }}>
                {String(result.maintenance_strategy).replace(/_/g, ' ')}
              </p>
              {result.summary && <p style={{ marginTop: 10, color: '#37474f' }}>{result.summary}</p>}
            </div>
          )}

          {Array.isArray(result.priority_actions) && result.priority_actions.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e9ef', fontWeight: 600 }}>Priority Actions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: '#f5f7fa' }}>
                  <tr>
                    <th style={th}>Action</th>
                    <th style={th}>Priority</th>
                    <th style={th}>Due</th>
                    <th style={th}>Hours</th>
                    <th style={th}>Cost</th>
                    <th style={th}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.priority_actions.map((a, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f2f5' }}>
                      <td style={td}>{a.action}</td>
                      <td style={td}>{a.priority}</td>
                      <td style={td}>{a.due_date_suggestion}</td>
                      <td style={td}>{a.estimated_hours ?? '-'}</td>
                      <td style={td}>{fmtCurrency(a.estimated_cost)}</td>
                      <td style={{ ...td, color: '#607d8b' }}>{a.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {Array.isArray(result.parts_to_stock) && result.parts_to_stock.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 600, marginTop: 0 }}>Parts to Stock</p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.parts_to_stock.map((p, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <strong>{p.part_name}</strong> ×{p.quantity} — <span style={{ color: '#607d8b' }}>{p.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.cost_benefit_analysis && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 600, marginTop: 0 }}>Cost / Benefit</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <Stat label="Current annual cost" value={fmtCurrency(result.cost_benefit_analysis.current_estimated_annual_cost)} />
                <Stat label="Optimized annual cost" value={fmtCurrency(result.cost_benefit_analysis.optimized_estimated_annual_cost)} />
                <Stat label="Potential savings" value={fmtCurrency(result.cost_benefit_analysis.potential_savings)} highlight />
              </div>
            </div>
          )}

          {/* fallback */}
          {!result.priority_actions && !result.maintenance_strategy && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 600, marginTop: 0 }}>Raw Response</p>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#37474f' }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const th = { textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: '#37474f', fontSize: 12 };
const td = { padding: '10px 14px', verticalAlign: 'top' };

function Stat({ label, value, highlight }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: '#607d8b', margin: 0, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: highlight ? '#16a34a' : '#111a24', margin: 0 }}>{value}</p>
    </div>
  );
}

export default MaintenanceRecommendation;
