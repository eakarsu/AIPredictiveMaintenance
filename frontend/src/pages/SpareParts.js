import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiPackage } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const formFields = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Part name' },
  { key: 'part_number', label: 'Part Number', required: true, placeholder: 'e.g. SP-001' },
  { key: 'category', label: 'Category', type: 'select', options: [
    { value: 'mechanical', label: 'Mechanical' }, { value: 'electrical', label: 'Electrical' },
    { value: 'hydraulic', label: 'Hydraulic' }, { value: 'pneumatic', label: 'Pneumatic' },
    { value: 'electronic', label: 'Electronic' }, { value: 'consumable', label: 'Consumable' },
    { value: 'other', label: 'Other' },
  ]},
  { key: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
  { key: 'min_quantity', label: 'Min Quantity (Reorder Level)', type: 'number', min: 0 },
  { key: 'unit_cost', label: 'Unit Cost ($)', type: 'number', step: 0.01 },
  { key: 'supplier', label: 'Supplier', placeholder: 'Supplier name' },
  { key: 'location', label: 'Storage Location', placeholder: 'Warehouse/shelf' },
  { key: 'description', label: 'Description', type: 'textarea' },
];

const detailFields = [
  { key: 'name', label: 'Name' },
  { key: 'part_number', label: 'Part Number' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity', render: (v, row) => {
    const low = row.min_quantity && v <= row.min_quantity;
    return <span style={{ color: low ? '#ff5252' : '#00e676', fontWeight: 700 }}>{v || 0}</span>;
  }},
  { key: 'min_quantity', label: 'Min Quantity' },
  { key: 'unit_cost', label: 'Unit Cost', render: v => v ? `$${Number(v).toFixed(2)}` : '-' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'location', label: 'Storage Location' },
  { key: 'description', label: 'Description' },
  { key: 'created_at', label: 'Added', render: v => v ? new Date(v).toLocaleDateString() : '-' },
];

const SpareParts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('spare-parts');
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
      await update('spare-parts', editing.id, formData);
    } else {
      await create('spare-parts', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('spare-parts', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const columns = [
    { header: 'Name', accessor: 'name', key: 'name' },
    { header: 'Part #', accessor: 'part_number', key: 'part_number' },
    { header: 'Category', accessor: 'category', key: 'category', render: v => <span style={{ textTransform: 'capitalize' }}>{v || '-'}</span> },
    { header: 'Quantity', accessor: 'quantity', key: 'quantity', render: (v, row) => {
      const low = row.min_quantity && v <= row.min_quantity;
      return (
        <span style={{ color: low ? '#ff5252' : '#e0e0e0', fontWeight: low ? 700 : 400 }}>
          {v || 0} {low && <span style={{ fontSize: 10, marginLeft: 4 }}>LOW</span>}
        </span>
      );
    }},
    { header: 'Min Qty', accessor: 'min_quantity', key: 'min_quantity' },
    { header: 'Unit Cost', accessor: 'unit_cost', key: 'unit_cost', render: v => v ? `$${Number(v).toFixed(2)}` : '-' },
    { header: 'Reorder', key: 'reorder', accessor: (row) => row.quantity <= (row.min_quantity || 0) ? 'yes' : 'no', render: (v) => (
      <span style={{
        padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
        backgroundColor: v === 'yes' ? '#ff525218' : '#00e67618',
        color: v === 'yes' ? '#ff5252' : '#00e676',
        border: `1px solid ${v === 'yes' ? '#ff525244' : '#00e67644'}`,
      }}>
        {v === 'yes' ? 'Reorder' : 'OK'}
      </span>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiPackage style={{ marginRight: 10 }} />Spare Parts Inventory</div>
          <div className="page-subtitle">{data.length} parts in inventory</div>
        </div>
        <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> Add Part</button>
      </div>

      <DataTable columns={columns} data={data} onRowClick={handleRowClick} />

      <DetailModal
        open={showDetail} title={selected?.name || 'Part Details'}
        data={selected || {}} fields={detailFields}
        onClose={() => setShowDetail(false)} onEdit={handleEdit} onDelete={handleDelete}
      />

      <FormModal
        open={showForm} title={editing ? 'Edit Part' : 'Add Spare Part'}
        fields={formFields} initialData={editing || {}}
        onSubmit={handleSubmit} onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete} title="Delete Part"
        message={`Delete "${confirmDelete?.name}"?`}
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default SpareParts;
