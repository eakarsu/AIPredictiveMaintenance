import React from 'react';

const colorMap = {
  operational: '#00e676',
  healthy: '#00e676',
  active: '#00e676',
  completed: '#00e676',
  resolved: '#00e676',
  low: '#00e676',
  open: '#1a73e8',
  'in progress': '#1a73e8',
  'in_progress': '#1a73e8',
  pending: '#ffc107',
  warning: '#ffc107',
  medium: '#ffc107',
  scheduled: '#ffc107',
  high: '#ff9800',
  critical: '#ff5252',
  offline: '#607d8b',
  cancelled: '#607d8b',
  inactive: '#607d8b',
  info: '#29b6f6',
};

const StatusBadge = ({ status, size = 'medium' }) => {
  const key = (status || '').toLowerCase();
  const color = colorMap[key] || '#607d8b';
  const padding = size === 'small' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'small' ? 11 : 12;

  return (
    <span style={{
      display: 'inline-block',
      padding,
      fontSize,
      fontWeight: 600,
      color: '#fff',
      backgroundColor: color + '22',
      border: `1px solid ${color}44`,
      borderRadius: 20,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: 6,
      }} />
      {status}
    </span>
  );
};

export default StatusBadge;
