import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// VIZ component #1: Failure Prediction Timeline
// Props: { data: { months: string[], series: [{ equipment_id, name, type, points: [{month, risk_pct}] }] } }
const COLORS = ['#1a73e8', '#e91e63', '#ff9800', '#4caf50', '#9c27b0', '#00bcd4', '#f44336', '#3f51b5'];

const FailureTimelineChart = ({ data }) => {
  if (!data || !data.months || !data.series || data.series.length === 0) {
    return (
      <div style={{ padding: 24, color: '#8899aa', textAlign: 'center', backgroundColor: '#1a2332', borderRadius: 12 }}>
        No timeline data available.
      </div>
    );
  }

  // Pivot to recharts format: [{ month, [assetName]: risk_pct, ... }, ...]
  const rows = data.months.map((m, idx) => {
    const row = { month: m };
    data.series.forEach(s => {
      row[s.name] = s.points[idx] ? s.points[idx].risk_pct : null;
    });
    return row;
  });

  return (
    <div style={{ backgroundColor: '#1a2332', borderRadius: 12, padding: 20, border: '1px solid #2a3a4a' }}>
      <div style={{ marginBottom: 12, color: '#fff', fontWeight: 600, fontSize: 15 }}>
        12-Month Failure Risk Forecast
      </div>
      <div style={{ width: '100%', height: 380 }}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
            <XAxis dataKey="month" stroke="#8899aa" fontSize={11} />
            <YAxis stroke="#8899aa" fontSize={11} domain={[0, 100]} label={{ value: 'Risk %', angle: -90, position: 'insideLeft', fill: '#8899aa', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f1923', border: '1px solid #2a3a4a', borderRadius: 8, color: '#e0e0e0' }}
              labelStyle={{ color: '#8899aa' }}
            />
            <Legend wrapperStyle={{ color: '#8899aa', fontSize: 12 }} />
            {data.series.map((s, idx) => (
              <Line
                key={s.equipment_id}
                type="monotone"
                dataKey={s.name}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#607d8b' }}>
        Risk is computed deterministically from current health score plus a type-specific logistic growth curve.
      </div>
    </div>
  );
};

export default FailureTimelineChart;
