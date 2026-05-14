import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlay, FiAlertTriangle } from 'react-icons/fi';
import api, { getAll } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Frontend for POST /api/ai/failure-root-cause
// Note: distinct from the existing /ai/root-cause-analysis which the FailureAnalysis page wires.
// This endpoint is targeted at a specific failure record id and updates failure_analysis.ai_analysis.
const FailureRootCause = () => {
  const [failures, setFailures] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAll('failure-analyses');
        const items = res.data?.data || res.data || [];
        setFailures(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const run = async () => {
    if (!selectedId) {
      setError('Select a failure record first');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      // JWT attached by axios interceptor (reads localStorage.getItem('token'))
      const res = await api.post('/ai/failure-root-cause', { failure_id: selectedId });
      setResult(res.data?.data?.analysis || res.data?.data || res.data);
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

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiSearch size={28} color="#1a73e8" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111a24', margin: 0 }}>Failure Root-Cause Analysis</h1>
            <p style={{ color: '#607d8b', fontSize: 13, margin: 0 }}>5-Why analysis with sensor evidence and prevention measures</p>
          </div>
        </div>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12,
        padding: 20, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#37474f', marginBottom: 6 }}>Failure Record</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #cfd8dc',
              borderRadius: 8, fontSize: 14, background: '#fff'
            }}
          >
            <option value="">Select failure…</option>
            {failures.map((f) => (
              <option key={f.id} value={f.id}>
                #{f.id} — {f.title || f.failure_type || 'failure'} {f.failure_date ? `(${new Date(f.failure_date).toLocaleDateString()})` : ''}
              </option>
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
          {loading ? 'Analyzing…' : 'Run Analysis'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <LoadingSpinner size="lg" />
          <p style={{ marginTop: 16, color: '#607d8b' }}>Correlating preceding sensor readings and maintenance history…</p>
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
          {result.primary_root_cause && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#607d8b', margin: 0, marginBottom: 6 }}>Primary Root Cause</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111a24', margin: 0 }}>{result.primary_root_cause}</p>
              {result.confidence_level != null && (
                <p style={{ marginTop: 10, color: '#1a73e8', fontWeight: 600 }}>Confidence: {result.confidence_level}%</p>
              )}
              {result.summary && <p style={{ marginTop: 10, color: '#37474f' }}>{result.summary}</p>}
            </div>
          )}

          {Array.isArray(result.contributing_causes) && result.contributing_causes.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 600, marginTop: 0 }}>Contributing Causes</p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.contributing_causes.map((c, i) => <li key={i} style={{ marginBottom: 4 }}>{c}</li>)}
              </ul>
            </div>
          )}

          {Array.isArray(result.five_why_analysis) && result.five_why_analysis.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 600, marginTop: 0 }}>5-Why Analysis</p>
              <ol style={{ paddingLeft: 22, margin: 0 }}>
                {result.five_why_analysis.map((w, i) => <li key={i} style={{ marginBottom: 6 }}>{w}</li>)}
              </ol>
            </div>
          )}

          {Array.isArray(result.corrective_actions) && result.corrective_actions.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e9ef', fontWeight: 600 }}>Corrective Actions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: '#f5f7fa' }}>
                  <tr>
                    <th style={th}>Action</th>
                    <th style={th}>Priority</th>
                    <th style={th}>Owner</th>
                    <th style={th}>Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {result.corrective_actions.map((a, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f2f5' }}>
                      <td style={td}>{a.action}</td>
                      <td style={td}>{a.priority}</td>
                      <td style={td}>{a.responsible_party}</td>
                      <td style={td}>{a.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {Array.isArray(result.prevention_measures) && result.prevention_measures.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e9ef', borderRadius: 12, padding: 20 }}>
              <p style={{ fontWeight: 600, marginTop: 0 }}>Prevention Measures</p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.prevention_measures.map((m, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <strong>{m.measure}</strong> — effectiveness {m.effectiveness_rating}, cost {m.implementation_cost}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!result.primary_root_cause && !result.five_why_analysis && (
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

export default FailureRootCause;
