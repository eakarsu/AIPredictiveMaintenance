import React, { useState, useEffect } from 'react';
import { FiUsers, FiUser, FiMail, FiShield } from 'react-icons/fi';
import { getAll } from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const detailFields = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: v => (
    <span style={{
      padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
      backgroundColor: v === 'admin' ? '#1a73e818' : '#00e67618',
      color: v === 'admin' ? '#1a73e8' : '#00e676',
      textTransform: 'capitalize',
    }}>
      {v}
    </span>
  )},
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status', render: v => <StatusBadge status={v || 'active'} /> },
  { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'last_login', label: 'Last Login', render: v => v ? new Date(v).toLocaleString() : '-' },
];

const UserManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAll('users');
        const items = res.data.data || res.data || [];
        setData(Array.isArray(items) ? items : []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const columns = [
    { header: 'Name', key: 'name', accessor: row => `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.name || '-', render: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: '#1a73e8', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FiUser size={14} color="#fff" />
        </div>
        <span>{v}</span>
      </div>
    )},
    { header: 'Email', accessor: 'email', key: 'email' },
    { header: 'Role', accessor: 'role', key: 'role', render: v => (
      <span style={{
        padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
        backgroundColor: v === 'admin' ? '#1a73e818' : v === 'manager' ? '#ffc10718' : '#00e67618',
        color: v === 'admin' ? '#1a73e8' : v === 'manager' ? '#ffc107' : '#00e676',
        textTransform: 'capitalize',
      }}>
        {v}
      </span>
    )},
    { header: 'Department', accessor: 'department', key: 'department' },
    { header: 'Status', accessor: 'status', key: 'status', render: v => <StatusBadge status={v || 'active'} size="small" /> },
    { header: 'Created', accessor: 'created_at', key: 'created_at', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiUsers style={{ marginRight: 10 }} />User Management</div>
          <div className="page-subtitle">{data.length} registered users</div>
        </div>
      </div>

      <DataTable columns={columns} data={data} onRowClick={row => { setSelected(row); setShowDetail(true); }} />

      <DetailModal
        open={showDetail}
        title={`${selected?.firstName || ''} ${selected?.lastName || ''}`.trim() || 'User Details'}
        data={selected || {}}
        fields={detailFields}
        onClose={() => setShowDetail(false)}
      />
    </div>
  );
};

export default UserManagement;
