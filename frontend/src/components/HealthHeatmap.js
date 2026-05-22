import React from 'react';

// VIZ component #2: Equipment Health Heatmap (asset rows x metric columns)
// Props: { data: { metrics: string[], assets: [{ id, name, type, health_score, scores: {metric: number} }] } }

// Color scale: 0 (red) -> 50 (amber) -> 100 (green)
function colorFor(score) {
  if (score == null || isNaN(score)) return '#2a3a4a';
  const s = Math.max(0, Math.min(100, Number(score)));
  if (s >= 75) {
    // green band
    const t = (s - 75) / 25;
    const r = Math.round(76 - 30 * t);   // 76->46
    const g = Math.round(175 + 30 * t);  // 175->205
    const b = Math.round(80 - 30 * t);   // 80->50
    return `rgb(${r},${g},${b})`;
  }
  if (s >= 50) {
    // amber band
    const t = (s - 50) / 25;
    const r = Math.round(255 - 50 * t); // 255 -> 205
    const g = Math.round(180 + 0 * t);  // ~180
    const b = Math.round(0 + 20 * t);   // 0 -> 20
    return `rgb(${r},${g},${b})`;
  }
  // red band
  const t = s / 50;
  const r = Math.round(220 - 20 * t); // 220->200
  const g = Math.round(40 + 60 * t);  // 40->100
  const b = Math.round(40 + 0 * t);   // 40
  return `rgb(${r},${g},${b})`;
}

const HealthHeatmap = ({ data }) => {
  if (!data || !data.metrics || !data.assets || data.assets.length === 0) {
    return (
      <div style={{ padding: 24, color: '#8899aa', textAlign: 'center', backgroundColor: '#1a2332', borderRadius: 12 }}>
        No heatmap data available.
      </div>
    );
  }

  const { metrics, assets } = data;

  return (
    <div style={{ backgroundColor: '#1a2332', borderRadius: 12, padding: 20, border: '1px solid #2a3a4a' }}>
      <div style={{ marginBottom: 12, color: '#fff', fontWeight: 600, fontSize: 15 }}>
        Equipment Health Heatmap (Asset x Metric)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', color: '#8899aa', fontSize: 12, fontWeight: 600, padding: '6px 10px' }}>Asset</th>
              <th style={{ textAlign: 'left', color: '#8899aa', fontSize: 12, fontWeight: 600, padding: '6px 10px' }}>Type</th>
              {metrics.map(m => (
                <th key={m} style={{ textAlign: 'center', color: '#8899aa', fontSize: 11, fontWeight: 600, padding: '6px 10px', textTransform: 'capitalize' }}>
                  {m.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.id}>
                <td style={{ color: '#e0e0e0', fontSize: 12, fontWeight: 500, padding: '8px 10px', backgroundColor: '#0f1923', borderRadius: 6 }}>
                  {a.name}
                </td>
                <td style={{ color: '#8899aa', fontSize: 11, padding: '8px 10px', backgroundColor: '#0f1923', borderRadius: 6 }}>
                  {a.type || '-'}
                </td>
                {metrics.map(m => {
                  const v = a.scores ? a.scores[m] : null;
                  const bg = colorFor(v);
                  const textColor = v != null && v >= 50 ? '#0f1923' : '#fff';
                  return (
                    <td
                      key={m}
                      title={`${a.name} / ${m}: ${v}`}
                      style={{
                        backgroundColor: bg,
                        color: textColor,
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '10px 8px',
                        borderRadius: 6,
                        minWidth: 64,
                      }}
                    >
                      {v == null ? '-' : v.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 14, fontSize: 11, color: '#8899aa' }}>
        <span>Scale:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, background: colorFor(20), borderRadius: 3 }} /> Critical
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, background: colorFor(60), borderRadius: 3 }} /> Warning
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, background: colorFor(90), borderRadius: 3 }} /> Healthy
        </span>
      </div>
    </div>
  );
};

export default HealthHeatmap;
