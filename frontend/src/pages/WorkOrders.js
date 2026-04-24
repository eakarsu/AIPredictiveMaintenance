import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiClipboard } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const formFields = [
  { key: 'title', label: 'Title', required: true, placeholder: 'Work order title' },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'type', label: 'Type', type: 'select', options: [
    { value: 'repair', label: 'Repair' }, { value: 'replacement', label: 'Replacement' },
    { value: 'inspection', label: 'Inspection' }, { value: 'calibration', label: 'Calibration' },
    { value: 'preventive', label: 'Preventive' },
  ]},
  { key: 'priority', label: 'Priority', type: 'select', required: true, options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
  ]},
  { key: 'assigned_to', label: 'Assigned To', placeholder: 'Technician name' },
  { key: 'estimatedCost', label: 'Estimated Cost ($)', type: 'number', step: 0.01 },
  { key: 'due_date', label: 'Due Date', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const detailFields = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority', render: v => <StatusBadge status={v} /> },
  { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  { key: 'assigned_to', label: 'Assigned To' },
  { key: 'equipment', label: 'Equipment', render: v => (v && typeof v === 'object') ? v.name : (v || '-') },
  { key: 'estimatedCost', label: 'Est. Cost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'actualCost', label: 'Actual Cost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'due_date', label: 'Due Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'completed_at', label: 'Completed', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleString() : '-' },
];

const WorkOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('work-orders');
      const items = res.data.data || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = statusFilter === 'all' ? data : data.filter(w => w.status === statusFilter);

  const handleRowClick = (row) => { setSelected(row); setShowDetail(true); };
  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (item) => { setShowDetail(false); setEditing(item); setShowForm(true); };
  const handleDelete = (item) => { setShowDetail(false); setConfirmDelete(item); };

  const handleSubmit = async (formData) => {
    if (editing) {
      await update('work-orders', editing.id, formData);
    } else {
      await create('work-orders', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('work-orders', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const columns = [
    { header: 'Title', accessor: 'title', key: 'title' },
    { header: 'Type', accessor: 'type', key: 'type', render: v => <span style={{ textTransform: 'capitalize' }}>{v || '-'}</span> },
    { header: 'Priority', accessor: 'priority', key: 'priority', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Status', accessor: 'status', key: 'status', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Assigned To', accessor: 'assigned_to', key: 'assigned_to' },
    { header: 'Est. Cost', accessor: 'estimatedCost', key: 'estimatedCost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
    { header: 'Due Date', accessor: 'due_date', key: 'due_date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  if (loading) return <LoadingSpinner />;

  const statusOpts = ['all', 'open', 'in_progress', 'completed', 'cancelled'];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiClipboard style={{ marginRight: 10 }} />Work Orders</div>
          <div className="page-subtitle">{data.length} total work orders</div>
        </div>
        <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> New Work Order</button>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {statusOpts.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              border: statusFilter === s ? '1px solid #1a73e8' : '1px solid #2a3a4a',
              backgroundColor: statusFilter === s ? '#1a73e8' + '18' : 'transparent',
              color: statusFilter === s ? '#1a73e8' : '#8899aa', cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} onRowClick={handleRowClick} />

      <DetailModal
        open={showDetail} title={selected?.title || 'Work Order Details'}
        data={selected || {}} fields={detailFields}
        onClose={() => setShowDetail(false)} onEdit={handleEdit} onDelete={handleDelete}
      />

      <FormModal
        open={showForm} title={editing ? 'Edit Work Order' : 'New Work Order'}
        fields={formFields} initialData={editing || {}}
        onSubmit={handleSubmit} onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete} title="Delete Work Order"
        message={`Delete "${confirmDelete?.title}"?`}
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default WorkOrders;
