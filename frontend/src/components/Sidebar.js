import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid, FiCpu, FiActivity, FiTrendingUp, FiCalendar,
  FiAlertTriangle, FiClipboard, FiSearch, FiHeart, FiZap,
  FiPackage, FiFileText, FiDollarSign, FiBarChart2, FiUsers,
  FiChevronLeft, FiChevronRight, FiSettings
} from 'react-icons/fi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: FiGrid },
  { path: '/equipment', label: 'Equipment', icon: FiCpu },
  { path: '/sensors', label: 'Sensors', icon: FiActivity },
  { path: '/predictive-analytics', label: 'Predictive Analytics', icon: FiTrendingUp, ai: true },
  { path: '/maintenance-schedules', label: 'Maintenance', icon: FiCalendar },
  { path: '/alerts', label: 'Alerts', icon: FiAlertTriangle },
  { path: '/work-orders', label: 'Work Orders', icon: FiClipboard },
  { path: '/failure-analysis', label: 'Failure Analysis', icon: FiSearch, ai: true },
  { path: '/equipment-health', label: 'Equipment Health', icon: FiHeart, ai: true },
  { path: '/anomaly-detection', label: 'Anomaly Detection', icon: FiZap, ai: true },
  { path: '/spare-parts', label: 'Spare Parts', icon: FiPackage },
  { path: '/maintenance-logs', label: 'Maintenance Logs', icon: FiFileText },
  { path: '/cost-analysis', label: 'Cost Analysis', icon: FiDollarSign, ai: true },
  { path: '/reports', label: 'Reports', icon: FiBarChart2 },
  { path: '/users', label: 'Users', icon: FiUsers },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const w = collapsed ? 72 : 260;

  return (
    <div style={{
      width: w, minWidth: w, height: '100vh', backgroundColor: '#111a24',
      borderRight: '1px solid #1e2d3d', display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s, min-width 0.2s', position: 'fixed', left: 0, top: 0,
      zIndex: 100, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 12px' : '20px 20px', display: 'flex',
        alignItems: 'center', gap: 12, borderBottom: '1px solid #1e2d3d',
        minHeight: 68,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, backgroundColor: '#1a73e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FiSettings size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>AI Maintenance</div>
            <div style={{ fontSize: 10, color: '#607d8b', fontWeight: 500 }}>PREDICTIVE PLATFORM</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '11px 14px' : '11px 14px',
                borderRadius: 10, cursor: 'pointer', marginBottom: 2,
                backgroundColor: active ? '#1a73e8' + '18' : 'transparent',
                color: active ? '#1a73e8' : '#8899aa',
                transition: 'all 0.15s', position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.backgroundColor = '#1e2d3d';
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={collapsed ? item.label : ''}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
              )}
              {!collapsed && item.ai && (
                <span style={{
                  marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#1a73e8',
                  backgroundColor: '#1a73e8' + '18', padding: '2px 6px',
                  borderRadius: 4, letterSpacing: 0.5,
                }}>
                  AI
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <div style={{ padding: 8, borderTop: '1px solid #1e2d3d' }}>
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 10, borderRadius: 8, cursor: 'pointer', color: '#607d8b',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e2d3d'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          {!collapsed && <span style={{ fontSize: 13, marginLeft: 8 }}>Collapse</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
