import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiPlay } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { getAll } from '../services/api';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CostForecast = () => {
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

  const runForecast = async () => {
    if (!selectedId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`/equipment/${selectedId}/ai-cost-forecast`);
      setResult(res.data.data?.forecast || res.data.data || res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  const monthlyData = result?.monthly_forecast?.map((m, i) => ({
    month: m.month || MONTH_NAMES[i] || `M${i + 1}`,
    cost: parseFloat(m.estimated_cost) || 0,
    description: m.description,
  })) || [];

  const maxCost = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.cost)) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiDollarSign style={{ marginRight: 10 }} />12-Month Cost Forecast</div>
          <div className="page-subtitle">AI-generated maintenance cost forecast per equipment</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 }}>Select Equipment</label>
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setResult(null); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 }}
            >
              <option value="">Choose equipment...</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} — {eq.type}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={runForecast}
            disabled={!selectedId || loading}
            style={{ opacity: !selectedId || loading ? 0.5 : 1 }}
          >
            <FiPlay size={14} /> Generate Forecast
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {result && !loading && (
        <>
          {/* Summary cards */}
          {result.total_annual && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div className="card">
                <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 4 }}>Total Annual Forecast</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1a73e8' }}>${parseFloat(result.total_annual).toLocaleString()}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 4 }}>Avg Monthly</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#00e676' }}>${Math.round(parseFloat(result.total_annual) / 12).toLocaleString()}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 4 }}>Confidence Level</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#ffc107' }}>{result.confidence_level || '--'}%</div>
              </div>
            </div>
          )}

          {/* Monthly forecast chart */}
          {monthlyData.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Monthly Cost Forecast</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis dataKey="month" tick={{ fill: '#607d8b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#607d8b', fontSize: 12 }} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111a24', border: '1px solid #2a3a4a', borderRadius: 8, color: '#e0e0e0' }}
                    formatter={v => [`$${parseFloat(v).toLocaleString()}`, 'Estimated Cost']}
                  />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell key={index} fill={entry.cost === maxCost ? '#ff5252' : '#1a73e8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Critical investments */}
          {result.critical_investments?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Critical Investments</div>
              {result.critical_investments.map((inv, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < result.critical_investments.length - 1 ? '1px solid #1e2d3d' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{inv.item}</div>
                    <div style={{ fontSize: 12, color: '#8899aa', marginTop: 4 }}>{inv.justification}</div>
                    {inv.recommended_month && <div style={{ fontSize: 11, color: '#607d8b', marginTop: 2 }}>Recommended: {inv.recommended_month}</div>}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#ff5252', flexShrink: 0, marginLeft: 16 }}>
                    ${typeof inv.cost === 'number' ? inv.cost.toLocaleString() : inv.cost}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cost reduction opportunities */}
          {result.cost_reduction_opportunities?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Cost Reduction Opportunities</div>
              {result.cost_reduction_opportunities.map((opp, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < result.cost_reduction_opportunities.length - 1 ? '1px solid #1e2d3d' : 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#00e676' }}>{opp.opportunity}</div>
                  <div style={{ fontSize: 12, color: '#8899aa', marginTop: 4 }}>{opp.implementation}</div>
                  {opp.potential_savings && <div style={{ fontSize: 12, color: '#ffc107', marginTop: 2 }}>Potential savings: {opp.potential_savings}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Full AI result */}
          {result.assumptions && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Forecast Assumptions</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.assumptions.map((a, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#8899aa', marginBottom: 6 }}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CostForecast;
