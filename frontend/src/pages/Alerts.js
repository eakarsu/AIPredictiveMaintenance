import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const formFields = [
  { key: 'title', label: 'Title', required: true, placeholder: 'Alert title' },
  { key: 'message', label: 'Message', type: 'textarea', required: true },
  { key: 'severity', label: 'Severity', type: 'select', required: true, options: [
    { value: 'info', label: 'Info' }, { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'open', label: 'Open' }, { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'resolved', label: 'Resolved' },
  ]},
  { key: 'source', label: 'Source', placeholder: 'e.g. Sensor, System, Manual' },
];

const detailFields = [
  { key: 'title', label: 'Title' },
  { key: 'message', label: 'Message' },
  { key: 'severity', label: 'Severity', render: v => <StatusBadge status={v} /> },
  { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  { key: 'source', label: 'Source' },
  { key: 'equipment', label: 'Equipment', render: v => (v && typeof v === 'object') ? v.name : (v || '-') },
  { key: 'sensor', label: 'Sensor', render: v => (v && typeof v === 'object') ? v.name : (v || '-') },
  { key: 'acknowledged_by', label: 'Acknowledged By' },
  { key: 'acknowledged_at', label: 'Acknowledged At', render: v => v ? new Date(v).toLocaleString() : '-' },
  { key: 'resolvedAt', label: 'Resolved At', render: v => v ? new Date(v).toLocaleString() : '-' },
  { key: 'created_at', label: 'Created At', render: v => v ? new Date(v).toLocaleString() : '-' },
];

const Alerts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('alerts');
      const items = res.data.data || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = filter === 'all' ? data : data.filter(a => a.severity === filter || a.status === filter);

  const handleRowClick = (row) => { setSelected(row); setShowDetail(true); };
  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (item) => { setShowDetail(false); setEditing(item); setShowForm(true); };
  const handleDelete = (item) => { setShowDetail(false); setConfirmDelete(item); };

  const handleAcknowledge = async (item) => {
    try {
      await update('alerts', item.id, { status: 'acknowledged', acknowledged_at: new Date().toISOString() });
      setShowDetail(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (formData) => {
    if (editing) {
      await update('alerts', editing.id, formData);
    } else {
      await create('alerts', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('alerts', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const columns = [
    { header: 'Severity', accessor: 'severity', key: 'severity', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Title', accessor: 'title', key: 'title' },
    { header: 'Message', accessor: 'message', key: 'message', render: v => (
      <span style={{ maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {v}
      </span>
    )},
    { header: 'Status', accessor: 'status', key: 'status', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Source', accessor: 'source', key: 'source' },
    { header: 'Created', accessor: 'created_at', key: 'created_at', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  if (loading) return <LoadingSpinner />;

  const filterBtns = ['all', 'critical', 'high', 'medium', 'low', 'info'];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiAlertTriangle style={{ marginRight: 10 }} />Alert Management</div>
          <div className="page-subtitle">{data.length} total alerts</div>
        </div>
        <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> Create Alert</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filterBtns.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: filter === f ? '1px solid #1a73e8' : '1px solid #2a3a4a',
              backgroundColor: filter === f ? '#1a73e8' + '18' : 'transparent',
              color: filter === f ? '#1a73e8' : '#8899aa', cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} onRowClick={handleRowClick} />

      <DetailModal
        open={showDetail} title={selected?.title || 'Alert Details'}
        data={selected || {}} fields={detailFields}
        onClose={() => setShowDetail(false)} onEdit={handleEdit} onDelete={handleDelete}
      >
        {selected && selected.status === 'open' && (
          <div style={{ marginTop: 16 }}>
            <button
              className="btn-primary"
              onClick={() => handleAcknowledge(selected)}
              style={{ backgroundColor: '#00e676' }}
            >
              <FiCheckCircle size={16} /> Acknowledge Alert
            </button>
          </div>
        )}
      </DetailModal>

      <FormModal
        open={showForm} title={editing ? 'Edit Alert' : 'Create Alert'}
        fields={formFields} initialData={editing || {}}
        onSubmit={handleSubmit} onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete} title="Delete Alert"
        message={`Delete alert "${confirmDelete?.title}"?`}
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Alerts;
