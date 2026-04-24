import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCpu, FiActivity, FiAlertTriangle, FiClipboard,
  FiHeart, FiDollarSign, FiArrowRight
} from 'react-icons/fi';
import { getAll } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: '#1a2332', borderRadius: 14, padding: 22,
      border: '1px solid #2a3a4a', cursor: 'pointer', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: 16,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3a4a'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      backgroundColor: color + '18', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={22} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: '#607d8b', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{value}</div>
    </div>
    <FiArrowRight size={16} color="#607d8b" />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    equipment: 0, sensors: 0, alerts: 0, workOrders: 0, healthScore: 0, monthlyCost: 0,
  });
  const [equipment, setEquipment] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eqRes, sensorRes, alertRes, woRes, schedRes] = await Promise.allSettled([
        getAll('equipment'),
        getAll('sensors'),
        getAll('alerts'),
        getAll('work-orders'),
        getAll('maintenance-schedules'),
      ]);

      const eq = eqRes.status === 'fulfilled' ? (eqRes.value.data.data || eqRes.value.data || []) : [];
      const sensors = sensorRes.status === 'fulfilled' ? (sensorRes.value.data.data || sensorRes.value.data || []) : [];
      const al = alertRes.status === 'fulfilled' ? (alertRes.value.data.data || alertRes.value.data || []) : [];
      const wo = woRes.status === 'fulfilled' ? (woRes.value.data.data || woRes.value.data || []) : [];
      const sc = schedRes.status === 'fulfilled' ? (schedRes.value.data.data || schedRes.value.data || []) : [];

      const eqList = Array.isArray(eq) ? eq : [];
      const sensorList = Array.isArray(sensors) ? sensors : [];
      const alertList = Array.isArray(al) ? al : [];
      const woList = Array.isArray(wo) ? wo : [];
      const scList = Array.isArray(sc) ? sc : [];

      const avgHealth = eqList.length > 0
        ? Math.round(eqList.reduce((sum, e) => sum + (e.health_score || 0), 0) / eqList.length)
        : 0;

      setStats({
        equipment: eqList.length,
        sensors: sensorList.filter(s => s.status === 'active').length,
        alerts: alertList.filter(a => a.status !== 'resolved').length,
        workOrders: woList.filter(w => w.status === 'open' || w.status === 'in_progress').length,
        healthScore: avgHealth,
        monthlyCost: '$' + (woList.reduce((sum, w) => sum + (w.estimatedCost || 0), 0)).toLocaleString(),
      });

      setEquipment(eqList.slice(0, 8));
      setAlerts(alertList.filter(a => a.status !== 'resolved').slice(0, 5));
      setSchedules(scList.slice(0, 5));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">AI Predictive Maintenance Overview</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        <StatCard icon={FiCpu} label="Total Equipment" value={stats.equipment} color="#1a73e8" onClick={() => navigate('/equipment')} />
        <StatCard icon={FiActivity} label="Active Sensors" value={stats.sensors} color="#00e676" onClick={() => navigate('/sensors')} />
        <StatCard icon={FiAlertTriangle} label="Open Alerts" value={stats.alerts} color="#ff5252" onClick={() => navigate('/alerts')} />
        <StatCard icon={FiClipboard} label="Pending Work Orders" value={stats.workOrders} color="#ff9800" onClick={() => navigate('/work-orders')} />
        <StatCard icon={FiHeart} label="Avg Health Score" value={stats.healthScore + '%'} color="#00e676" onClick={() => navigate('/equipment-health')} />
        <StatCard icon={FiDollarSign} label="Est. Monthly Cost" value={stats.monthlyCost} color="#ffc107" onClick={() => navigate('/cost-analysis')} />
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Equipment Health Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Equipment Health</div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => navigate('/equipment-health')}>
              View All
            </button>
          </div>
          {equipment.map(eq => (
            <div key={eq.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: '1px solid #1e2d3d', cursor: 'pointer',
            }} onClick={() => navigate('/equipment')}>
              <div style={{ flex: 1, fontSize: 13, color: '#c0d0e0' }}>{eq.name}</div>
              <div style={{ width: 120, height: 8, backgroundColor: '#0f1923', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${eq.health_score || 0}%`, height: '100%', borderRadius: 4,
                  backgroundColor: (eq.health_score || 0) >= 80 ? '#00e676' : (eq.health_score || 0) >= 60 ? '#ffc107' : '#ff5252',
                }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8899aa', width: 36, textAlign: 'right' }}>
                {eq.health_score || 0}%
              </div>
            </div>
          ))}
          {equipment.length === 0 && <div style={{ color: '#607d8b', fontSize: 13, padding: 20, textAlign: 'center' }}>No equipment data</div>}
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Recent Alerts</div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => navigate('/alerts')}>
              View All
            </button>
          </div>
          {alerts.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: '1px solid #1e2d3d', cursor: 'pointer',
            }} onClick={() => navigate('/alerts')}>
              <StatusBadge status={a.severity} size="small" />
              <div style={{ flex: 1, fontSize: 13, color: '#c0d0e0' }}>{a.title || a.message}</div>
              <div style={{ fontSize: 11, color: '#607d8b' }}>
                {a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}
              </div>
            </div>
          ))}
          {alerts.length === 0 && <div style={{ color: '#607d8b', fontSize: 13, padding: 20, textAlign: 'center' }}>No active alerts</div>}
        </div>
      </div>

      {/* Upcoming Maintenance */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Upcoming Maintenance</div>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => navigate('/maintenance-schedules')}>
            View All
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {schedules.map(s => (
            <div key={s.id} style={{
              padding: 14, backgroundColor: '#0f1923', borderRadius: 10,
              border: '1px solid #1e2d3d', cursor: 'pointer',
            }} onClick={() => navigate('/maintenance-schedules')}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', marginBottom: 6 }}>{s.title || s.name || 'Scheduled Task'}</div>
              <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 4 }}>
                {s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString() : 'TBD'}
              </div>
              <StatusBadge status={s.priority || s.status || 'medium'} size="small" />
            </div>
          ))}
          {schedules.length === 0 && <div style={{ color: '#607d8b', fontSize: 13, padding: 20 }}>No upcoming maintenance</div>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
