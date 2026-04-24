import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{
      height: 64, backgroundColor: '#111a24', borderBottom: '1px solid #1e2d3d',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      padding: '0 28px', gap: 16,
    }}>
      {/* Notification bell */}
      <div style={{
        position: 'relative', cursor: 'pointer', padding: 8, borderRadius: 8,
        color: '#8899aa',
      }}>
        <FiBell size={18} />
        <div style={{
          position: 'absolute', top: 5, right: 5, width: 8, height: 8,
          borderRadius: '50%', backgroundColor: '#ff5252',
        }} />
      </div>

      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            padding: '6px 12px', borderRadius: 8,
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            backgroundColor: '#1a73e8', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <FiUser size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>
              {user?.firstName || user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: '#607d8b' }}>{user?.role || 'Admin'}</div>
          </div>
          <FiChevronDown size={14} color="#607d8b" />
        </div>

        {showMenu && (
          <div style={{
            position: 'absolute', top: 50, right: 0, width: 180,
            backgroundColor: '#1a2332', border: '1px solid #2a3a4a',
            borderRadius: 10, overflow: 'hidden', zIndex: 200,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div
              onClick={() => { setShowMenu(false); logout(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                cursor: 'pointer', color: '#ff5252', fontSize: 13, fontWeight: 500,
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e2d3d'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FiLogOut size={15} /> Sign Out
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
