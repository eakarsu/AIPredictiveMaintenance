import React from 'react';

const getColor = (score) => {
  if (score >= 80) return '#00e676';
  if (score >= 60) return '#ffc107';
  if (score >= 40) return '#ff9800';
  return '#ff5252';
};

const HealthScore = ({ score = 0, size = 80, strokeWidth = 6, showLabel = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1a2332" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={size * 0.25} fontWeight="700"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {showLabel && (
        <span style={{ fontSize: 11, color: '#8899aa', marginTop: 4 }}>Health Score</span>
      )}
    </div>
  );
};

export default HealthScore;
