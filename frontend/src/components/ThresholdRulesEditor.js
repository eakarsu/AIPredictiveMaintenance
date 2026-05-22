import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ component #2: Threshold Rules Editor (CRUD per asset class)
// Backed by /custom-views/threshold-rules
// Each rule: { id, asset_class, metric, min_value, max_value, severity, action }

const ASSET_CLASSES = ['Pump', 'Motor', 'Compressor', 'Conveyor', 'Generator', 'Turbine', 'HVAC'];
const METRICS = ['vibration', 'temperature', 'pressure', 'current', 'rpm', 'oil_quality', 'voltage'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ACTIONS = ['alert', 'create_work_order', 'shutdown'];

const empty = {
  asset_class: ASSET_CLASSES[0],
  metric: METRICS[0],
  min_value: '',
  max_value: '',
  severity: 'medium',
  action: 'alert',
};

const ThresholdRulesEditor = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [filterClass, setFilterClass] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/custom-views/threshold-rules');
      setRules(r.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setForm({
      asset_class: rule.asset_class || ASSET_CLASSES[0],
      metric: rule.metric || METRICS[0],
      min_value: rule.min_value == null ? '' : String(rule.min_value),
      max_value: rule.max_value == null ? '' : String(rule.max_value),
      severity: rule.severity || 'medium',
      action: rule.action || 'alert',
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(empty); };

  const save = async () => {
    setError('');
    const payload = {
      asset_class: form.asset_class,
      metric: form.metric,
      min_value: form.min_value === '' ? null : Number(form.min_value),
      max_value: form.max_value === '' ? null : Number(form.max_value),
      severity: form.severity,
      action: form.action,
    };
    try {
      if (editingId) {
        await api.put(`/custom-views/threshold-rules/${editingId}`, payload);
      } else {
        await api.post('/custom-views/threshold-rules', payload);
      }
      setForm(empty); setEditingId(null);
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await api.delete(`/custom-views/threshold-rules/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Delete failed');
    }
  };

  const filtered = filterClass ? rules.filter(r => r.asset_class === filterClass) : rules;

  const inputStyle = {
    padding: '7px 10px', borderRadius: 8, backgroundColor: '#0f1923',
    border: '1px solid #2a3a4a', color: '#e0e0e0', fontSize: 12, outline: 'none', minWidth: 110,
  };
  const selectStyle = { ...inputStyle, minWidth: 130 };

  return (
    <div style={{ backgroundColor: '#1a2332', borderRadius: 12, padding: 20, border: '1px solid #2a3a4a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Threshold Rules (per Asset Class)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#8899aa', fontSize: 12 }}>Filter:</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={selectStyle}>
            <option value="">All asset classes</option>
            {ASSET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={load}
            style={{
              padding: '7px 14px', borderRadius: 8, border: '1px solid #2a3a4a',
              backgroundColor: 'transparent', color: '#8899aa', fontSize: 12, cursor: 'pointer',
            }}
          >Refresh</button>
        </div>
      </div>

      {/* Editor form */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 14,
        padding: 12, backgroundColor: '#0f1923', borderRadius: 8, border: '1px dashed #2a3a4a',
      }}>
        <select value={form.asset_class} onChange={e => onChange('asset_class', e.target.value)} style={selectStyle}>
          {ASSET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.metric} onChange={e => onChange('metric', e.target.value)} style={selectStyle}>
          {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="number" placeholder="Min" value={form.min_value} onChange={e => onChange('min_value', e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Max" value={form.max_value} onChange={e => onChange('max_value', e.target.value)} style={inputStyle} />
        <select value={form.severity} onChange={e => onChange('severity', e.target.value)} style={selectStyle}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.action} onChange={e => onChange('action', e.target.value)} style={selectStyle}>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={save}
            style={{
              flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none',
              backgroundColor: '#1a73e8', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >{editingId ? 'Update' : 'Add'}</button>
          {editingId && (
            <button
              onClick={cancelEdit}
              style={{
                padding: '7px 12px', borderRadius: 8, border: '1px solid #2a3a4a',
                backgroundColor: 'transparent', color: '#8899aa', fontSize: 12, cursor: 'pointer',
              }}
            >Cancel</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: 12, padding: 10, borderRadius: 8,
          backgroundColor: '#ff525218', color: '#ff5252', fontSize: 13,
          border: '1px solid #ff525244',
        }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: '#8899aa', textAlign: 'center', padding: 20 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#8899aa', textAlign: 'center', padding: 20 }}>No threshold rules.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: '#8899aa', borderBottom: '1px solid #2a3a4a' }}>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Asset Class</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Metric</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Min</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Max</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Severity</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Action</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Ops</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ color: '#e0e0e0', borderBottom: '1px solid #1e2d3d' }}>
                  <td style={{ padding: '8px 6px' }}>{r.id}</td>
                  <td style={{ padding: '8px 6px' }}>{r.asset_class}</td>
                  <td style={{ padding: '8px 6px' }}>{r.metric}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right' }}>{r.min_value ?? '-'}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right' }}>{r.max_value ?? '-'}</td>
                  <td style={{ padding: '8px 6px' }}>{r.severity}</td>
                  <td style={{ padding: '8px 6px' }}>{r.action}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                    <button
                      onClick={() => startEdit(r)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: '1px solid #2a3a4a',
                        background: 'transparent', color: '#1a73e8', cursor: 'pointer', fontSize: 11, marginRight: 6,
                      }}
                    >Edit</button>
                    <button
                      onClick={() => remove(r.id)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: '1px solid #ff525244',
                        background: 'transparent', color: '#ff5252', cursor: 'pointer', fontSize: 11,
                      }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ThresholdRulesEditor;
