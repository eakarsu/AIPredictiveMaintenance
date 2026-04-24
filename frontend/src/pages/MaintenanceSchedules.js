import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiCalendar } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const formFields = [
  { key: 'title', label: 'Title', required: true, placeholder: 'Schedule title' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'type', label: 'Type', type: 'select', options: [
    { value: 'preventive', label: 'Preventive' }, { value: 'predictive', label: 'Predictive' },
    { value: 'corrective', label: 'Corrective' }, { value: 'inspection', label: 'Inspection' },
  ]},
  { key: 'priority', label: 'Priority', type: 'select', required: true, options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'scheduled', label: 'Scheduled' }, { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
  ]},
  { key: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
  { key: 'estimatedDuration', label: 'Estimated Duration (hours)', type: 'number', step: 0.5 },
  { key: 'assigned_to', label: 'Assigned To', placeholder: 'Technician name' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const detailFields = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority', render: v => <StatusBadge status={v} /> },
  { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  { key: 'scheduledDate', label: 'Scheduled Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'estimatedDuration', label: 'Est. Duration', render: v => v ? `${v} hours` : '-' },
  { key: 'assigned_to', label: 'Assigned To' },
  { key: 'equipment', label: 'Equipment', render: v => (v && typeof v === 'object') ? v.name : (v || '-') },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleString() : '-' },
];

const MaintenanceSchedules = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('maintenance-schedules');
      const items = res.data.data || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRowClick = (row) => { setSelected(row); setShowDetail(true); };
  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (item) => { setShowDetail(false); setEditing(item); setShowForm(true); };
  const handleDelete = (item) => { setShowDetail(false); setConfirmDelete(item); };

  const handleSubmit = async (formData) => {
    if (editing) {
      await update('maintenance-schedules', editing.id, formData);
    } else {
      await create('maintenance-schedules', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('maintenance-schedules', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const columns = [
    { header: 'Title', accessor: 'title', key: 'title' },
    { header: 'Type', accessor: 'type', key: 'type', render: v => <span style={{ textTransform: 'capitalize' }}>{v || '-'}</span> },
    { header: 'Priority', accessor: 'priority', key: 'priority', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Status', accessor: 'status', key: 'status', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Scheduled Date', accessor: 'scheduledDate', key: 'scheduledDate',
      render: v => v ? new Date(v).toLocaleDateString() : '-' },
    { header: 'Assigned To', accessor: 'assigned_to', key: 'assigned_to' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiCalendar style={{ marginRight: 10 }} />Maintenance Schedules</div>
          <div className="page-subtitle">{data.length} schedules</div>
        </div>
        <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> Add Schedule</button>
      </div>

      <DataTable columns={columns} data={data} onRowClick={handleRowClick} />

      <DetailModal
        open={showDetail} title={selected?.title || 'Schedule Details'}
        data={selected || {}} fields={detailFields}
        onClose={() => setShowDetail(false)} onEdit={handleEdit} onDelete={handleDelete}
      />

      <FormModal
        open={showForm} title={editing ? 'Edit Schedule' : 'New Schedule'}
        fields={formFields} initialData={editing || {}}
        onSubmit={handleSubmit} onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete} title="Delete Schedule"
        message={`Delete "${confirmDelete?.title}"?`}
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default MaintenanceSchedules;
