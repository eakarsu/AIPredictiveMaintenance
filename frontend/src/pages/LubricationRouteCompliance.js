import React, { useEffect, useState } from 'react';

const emptyForm = { assetRoute: '', technician: '', pointsDue: 0, pointsCompleted: 0, lubricant: '', exception: '', status: 'open' };

export default function LubricationRouteCompliance() {
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pointsDue: 0, pointsCompleted: 0, atRisk: 0 });
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const res = await fetch('/api/lubrication-route-compliance', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setRoutes(data.routes || []);
    setSummary(data.summary || { total: 0, pointsDue: 0, pointsCompleted: 0, atRisk: 0 });
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    await fetch('/api/lubrication-route-compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(form)
    });
    setForm(emptyForm);
    load();
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0 }}>Lubrication Route Compliance</h1>
        <p style={{ color: '#607d8b' }}>Track PM lubrication points, exceptions, and technician route completion.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          ['Routes', summary.total],
          ['Points Due', summary.pointsDue],
          ['Completed', summary.pointsCompleted],
          ['At Risk', summary.atRisk],
        ].map(([label, value]) => <div key={label} style={{ background: '#111a24', border: '1px solid #1e2d3d', borderRadius: 8, padding: 16 }}><div style={{ color: '#8899aa', fontSize: 13 }}>{label}</div><strong style={{ fontSize: 24 }}>{value}</strong></div>)}
      </div>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, background: '#111a24', border: '1px solid #1e2d3d', borderRadius: 8, padding: 16 }}>
        {['assetRoute', 'technician', 'lubricant', 'exception'].map(field => <input key={field} placeholder={field} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />)}
        <input type="number" value={form.pointsDue} onChange={e => setForm({ ...form, pointsDue: e.target.value })} />
        <input type="number" value={form.pointsCompleted} onChange={e => setForm({ ...form, pointsCompleted: e.target.value })} />
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>open</option><option>at risk</option><option>complete</option></select>
        <button type="submit">Add Route</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111a24' }}>
        <thead><tr>{['Route', 'Tech', 'Due', 'Done', 'Lubricant', 'Exception', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: 12, borderBottom: '1px solid #1e2d3d' }}>{h}</th>)}</tr></thead>
        <tbody>{routes.map(row => <tr key={row.id}><td style={{ padding: 12 }}>{row.assetRoute}</td><td>{row.technician}</td><td>{row.pointsDue}</td><td>{row.pointsCompleted}</td><td>{row.lubricant}</td><td>{row.exception}</td><td>{row.status}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
