import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiFileText } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const formFields = [
  { key: 'title', label: 'Title', required: true, placeholder: 'Log title' },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'type', label: 'Type', type: 'select', options: [
    { value: 'preventive', label: 'Preventive' }, { value: 'corrective', label: 'Corrective' },
    { value: 'inspection', label: 'Inspection' }, { value: 'emergency', label: 'Emergency' },
    { value: 'calibration', label: 'Calibration' },
  ]},
  { key: 'performed_by', label: 'Performed By', required: true, placeholder: 'Technician name' },
  { key: 'startDate', label: 'Start Date', type: 'date' },
  { key: 'endDate', label: 'End Date', type: 'date' },
  { key: 'duration', label: 'Duration (hours)', type: 'number', step: 0.5 },
  { key: 'cost', label: 'Cost ($)', type: 'number', step: 0.01 },
  { key: 'parts_used', label: 'Parts Used', type: 'textarea', placeholder: 'List parts used' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const detailFields = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type', render: v => <span style={{ textTransform: 'capitalize' }}>{v || '-'}</span> },
  { key: 'equipment', label: 'Equipment', render: v => (v && typeof v === 'object') ? v.name : (v || '-') },
  { key: 'performed_by', label: 'Performed By' },
  { key: 'startDate', label: 'Start Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'endDate', label: 'End Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'duration', label: 'Duration', render: v => v ? `${v} hours` : '-' },
  { key: 'cost', label: 'Cost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'parts_used', label: 'Parts Used' },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Logged At', render: v => v ? new Date(v).toLocaleString() : '-' },
];

const MaintenanceLogs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('maintenance-logs');
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
      await update('maintenance-logs', editing.id, formData);
    } else {
      await create('maintenance-logs', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('maintenance-logs', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const columns = [
    { header: 'Title', accessor: 'title', key: 'title' },
    { header: 'Type', accessor: 'type', key: 'type', render: v => <span style={{ textTransform: 'capitalize' }}>{v || '-'}</span> },
    { header: 'Performed By', accessor: 'performed_by', key: 'performed_by' },
    { header: 'Date', accessor: 'startDate', key: 'startDate', render: v => v ? new Date(v).toLocaleDateString() : '-' },
    { header: 'Duration', accessor: 'duration', key: 'duration', render: v => v ? `${v}h` : '-' },
    { header: 'Cost', accessor: 'cost', key: 'cost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiFileText style={{ marginRight: 10 }} />Maintenance Logs</div>
          <div className="page-subtitle">{data.length} log entries</div>
        </div>
        <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> Add Log</button>
      </div>

      <DataTable columns={columns} data={data} onRowClick={handleRowClick} />

      <DetailModal
        open={showDetail} title={selected?.title || 'Log Details'}
        data={selected || {}} fields={detailFields}
        onClose={() => setShowDetail(false)} onEdit={handleEdit} onDelete={handleDelete}
      />

      <FormModal
        open={showForm} title={editing ? 'Edit Log' : 'Add Maintenance Log'}
        fields={formFields} initialData={editing || {}}
        onSubmit={handleSubmit} onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete} title="Delete Log"
        message={`Delete "${confirmDelete?.title}"?`}
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default MaintenanceLogs;
