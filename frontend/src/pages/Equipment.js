import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiCpu } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const formFields = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Equipment name' },
  { key: 'type', label: 'Type', required: true, type: 'select', options: [
    { value: 'CNC Machine', label: 'CNC Machine' }, { value: 'Conveyor Belt', label: 'Conveyor Belt' },
    { value: 'Hydraulic Press', label: 'Hydraulic Press' }, { value: 'Compressor', label: 'Compressor' },
    { value: 'Generator', label: 'Generator' }, { value: 'Pump', label: 'Pump' },
    { value: 'Motor', label: 'Motor' }, { value: 'Turbine', label: 'Turbine' },
  ]},
  { key: 'manufacturer', label: 'Manufacturer', placeholder: 'Manufacturer name' },
  { key: 'model', label: 'Model', placeholder: 'Model number' },
  { key: 'serialNumber', label: 'Serial Number', placeholder: 'Serial number' },
  { key: 'location', label: 'Location', required: true, placeholder: 'e.g. Building A, Floor 2' },
  { key: 'department', label: 'Department', placeholder: 'Department name' },
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'operational', label: 'Operational' }, { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' }, { value: 'offline', label: 'Offline' },
  ]},
  { key: 'health_score', label: 'Health Score (0-100)', type: 'number', min: 0, max: 100, step: 1 },
  { key: 'install_date', label: 'Install Date', type: 'date' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

const detailFields = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'model', label: 'Model' },
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'location', label: 'Location' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  { key: 'health_score', label: 'Health Score', render: v => {
    const score = v || 0;
    const color = score >= 80 ? '#00e676' : score >= 60 ? '#ffc107' : '#ff5252';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 100, height: 8, backgroundColor: '#0f1923', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
        </div>
        <span style={{ color, fontWeight: 600 }}>{score}%</span>
      </div>
    );
  }},
  { key: 'install_date', label: 'Install Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'last_maintenance', label: 'Last Maintenance', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'description', label: 'Description' },
];

const Equipment = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('equipment');
      const items = res.data.data || res.data || [];
      setData(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRowClick = (row) => { setSelected(row); setShowDetail(true); };

  const handleAdd = () => { setEditing(null); setShowForm(true); };

  const handleEdit = (item) => {
    setShowDetail(false);
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setShowDetail(false);
    setConfirmDelete(item);
  };

  const handleSubmit = async (formData) => {
    if (editing) {
      await update('equipment', editing.id, formData);
    } else {
      await create('equipment', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('equipment', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const columns = [
    { header: 'Name', accessor: 'name', key: 'name' },
    { header: 'Type', accessor: 'type', key: 'type' },
    { header: 'Location', accessor: 'location', key: 'location' },
    { header: 'Status', accessor: 'status', key: 'status', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Health', accessor: 'health_score', key: 'health_score', render: v => {
      const score = v || 0;
      const color = score >= 80 ? '#00e676' : score >= 60 ? '#ffc107' : '#ff5252';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 60, height: 6, backgroundColor: '#0f1923', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{score}%</span>
        </div>
      );
    }},
    { header: 'Last Maintenance', accessor: 'last_maintenance', key: 'last_maintenance',
      render: v => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiCpu style={{ marginRight: 10 }} />Equipment Management</div>
          <div className="page-subtitle">{data.length} total equipment registered</div>
        </div>
        <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> Add New Equipment</button>
      </div>

      <DataTable columns={columns} data={data} onRowClick={handleRowClick} />

      <DetailModal
        open={showDetail}
        title={selected?.name || 'Equipment Details'}
        data={selected || {}}
        fields={detailFields}
        onClose={() => setShowDetail(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        open={showForm}
        title={editing ? 'Edit Equipment' : 'Add New Equipment'}
        fields={formFields}
        initialData={editing || {}}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Equipment;
