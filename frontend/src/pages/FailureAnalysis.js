import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiSearch, FiZap } from 'react-icons/fi';
import { getAll, create, update, remove } from '../services/api';
import api from '../services/api';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import AIResultDisplay from '../components/AIResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const formFields = [
  { key: 'title', label: 'Title', required: true, placeholder: 'Failure title' },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'failure_type', label: 'Failure Type', type: 'select', options: [
    { value: 'mechanical', label: 'Mechanical' }, { value: 'electrical', label: 'Electrical' },
    { value: 'software', label: 'Software' }, { value: 'hydraulic', label: 'Hydraulic' },
    { value: 'thermal', label: 'Thermal' }, { value: 'wear', label: 'Wear & Tear' },
    { value: 'other', label: 'Other' },
  ]},
  { key: 'severity', label: 'Severity', type: 'select', required: true, options: [
    { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
  ]},
  { key: 'failure_date', label: 'Failure Date', type: 'date' },
  { key: 'root_cause', label: 'Root Cause', type: 'textarea', placeholder: 'Describe root cause if known' },
  { key: 'corrective_action', label: 'Corrective Actions', type: 'textarea' },
  { key: 'downtimeHours', label: 'Downtime (hours)', type: 'number', step: 0.5 },
  { key: 'cost', label: 'Cost ($)', type: 'number', step: 0.01 },
];

const detailFields = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'failure_type', label: 'Failure Type' },
  { key: 'severity', label: 'Severity', render: v => <StatusBadge status={v} /> },
  { key: 'failure_date', label: 'Failure Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
  { key: 'equipment', label: 'Equipment', render: v => (v && typeof v === 'object') ? v.name : (v || '-') },
  { key: 'root_cause', label: 'Root Cause' },
  { key: 'corrective_action', label: 'Corrective Actions' },
  { key: 'downtimeHours', label: 'Downtime', render: v => v ? `${v} hours` : '-' },
  { key: 'cost', label: 'Cost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
  { key: 'status', label: 'Status', render: v => <StatusBadge status={v || 'open'} /> },
  { key: 'created_at', label: 'Created', render: v => v ? new Date(v).toLocaleString() : '-' },
];

const FailureAnalysis = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getAll('failure-analyses');
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
      await update('failure-analyses', editing.id, formData);
    } else {
      await create('failure-analyses', formData);
    }
    setShowForm(false);
    loadData();
  };

  const handleConfirmDelete = async () => {
    await remove('failure-analyses', confirmDelete.id);
    setConfirmDelete(null);
    loadData();
  };

  const runAiAnalysis = async (item) => {
    setShowDetail(false);
    setSelected(item);
    setShowAi(true);
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/root-cause-analysis', {
        failure_id: item.id,
        description: item.description,
        failure_type: item.failure_type,
        equipment_id: item.equipment?.id || item.equipment,
      });
      const d = res.data.data || res.data;
      setAiResult(d.analysis || d.result || d);
    } catch (err) {
      setAiResult('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title', key: 'title' },
    { header: 'Type', accessor: 'failure_type', key: 'failure_type', render: v => <span style={{ textTransform: 'capitalize' }}>{v || '-'}</span> },
    { header: 'Severity', accessor: 'severity', key: 'severity', render: v => <StatusBadge status={v} size="small" /> },
    { header: 'Date', accessor: 'failure_date', key: 'failure_date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
    { header: 'Downtime', accessor: 'downtimeHours', key: 'downtimeHours', render: v => v ? `${v}h` : '-' },
    { header: 'Cost', accessor: 'cost', key: 'cost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
    { header: 'AI Analysis', key: 'ai', accessor: () => null, render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); runAiAnalysis(row); }}
        style={{
          padding: '4px 10px', borderRadius: 6, border: '1px solid #1a73e8',
          backgroundColor: '#1a73e8' + '18', color: '#1a73e8',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <FiZap size={12} /> Analyze
      </button>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiSearch style={{ marginRight: 10 }} />Failure Analysis</div>
          <div className="page-subtitle">{data.length} failure records</div>
        </div>
        <button className="btn-primary" onClick={handleAdd}><FiPlus size={16} /> New Analysis</button>
      </div>

      <DataTable columns={columns} data={data} onRowClick={handleRowClick} />

      <DetailModal
        open={showDetail} title={selected?.title || 'Failure Details'}
        data={selected || {}} fields={detailFields}
        onClose={() => setShowDetail(false)} onEdit={handleEdit} onDelete={handleDelete}
      >
        <div style={{ marginTop: 16 }}>
          <button
            className="btn-primary" onClick={() => runAiAnalysis(selected)}
            style={{ backgroundColor: '#7c4dff' }}
          >
            <FiZap size={16} /> Run AI Root Cause Analysis
          </button>
        </div>
      </DetailModal>

      {/* AI Result Modal */}
      {showAi && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowAi(false)}>
          <div style={{
            backgroundColor: '#1a2332', borderRadius: 16, width: 700,
            maxWidth: '92vw', maxHeight: '85vh', overflow: 'auto',
            border: '1px solid #2a3a4a', padding: 24,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiZap size={18} color="#7c4dff" /> AI Root Cause Analysis
              </div>
              <button onClick={() => setShowAi(false)} style={{ background: 'none', border: 'none', color: '#607d8b', cursor: 'pointer', fontSize: 18 }}>x</button>
            </div>
            {selected && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#0f1923', borderRadius: 8, fontSize: 13, color: '#8899aa' }}>
                Analyzing: <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{selected.title}</span>
              </div>
            )}
            <AIResultDisplay result={aiResult} loading={aiLoading} />
          </div>
        </div>
      )}

      <FormModal
        open={showForm} title={editing ? 'Edit Failure' : 'New Failure Analysis'}
        fields={formFields} initialData={editing || {}}
        onSubmit={handleSubmit} onClose={() => setShowForm(false)}
        submitText={editing ? 'Update' : 'Create'}
      />

      <ConfirmDialog
        open={!!confirmDelete} title="Delete Failure Record"
        message={`Delete "${confirmDelete?.title}"?`}
        onConfirm={handleConfirmDelete} onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default FailureAnalysis;
