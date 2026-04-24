import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiPlay } from 'react-icons/fi';
import { getAll } from '../services/api';
import api from '../services/api';
import DataTable from '../components/DataTable';
import AIResultDisplay from '../components/AIResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const CostAnalysis = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [woRes, logRes] = await Promise.allSettled([
          getAll('work-orders'),
          getAll('maintenance-logs'),
        ]);
        const wo = woRes.status === 'fulfilled' ? (woRes.value.data.data || woRes.value.data || []) : [];
        const lg = logRes.status === 'fulfilled' ? (logRes.value.data.data || logRes.value.data || []) : [];
        setWorkOrders(Array.isArray(wo) ? wo : []);
        setLogs(Array.isArray(lg) ? lg : []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalEstCost = workOrders.reduce((sum, w) => sum + (parseFloat(w.cost) || 0), 0);
  const totalActCost = workOrders.filter(w => w.status === 'completed').reduce((sum, w) => sum + (parseFloat(w.cost) || 0), 0);
  const logCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0);
  const totalCost = totalActCost + logCost;

  const runOptimization = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/cost-optimization', {
        totalCost,
        workOrderCount: workOrders.length,
        maintenanceLogCount: logs.length,
      });
      const d = res.data.data || res.data;
      setAiResult(d.analysis || d.result || d);
    } catch (err) {
      setAiResult('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const costColumns = [
    { header: 'Title', accessor: 'title', key: 'title' },
    { header: 'Type', accessor: 'type', key: 'type', render: v => <span style={{ textTransform: 'capitalize' }}>{v || '-'}</span> },
    { header: 'Est. Hours', accessor: 'estimated_hours', key: 'estimated_hours', render: v => v ? `${v}h` : '-' },
    { header: 'Cost', accessor: 'cost', key: 'cost', render: v => v ? `$${Number(v).toLocaleString()}` : '-' },
    { header: 'Status', accessor: 'status', key: 'status', render: v => <span style={{ textTransform: 'capitalize', color: '#8899aa' }}>{(v || '').replace('_', ' ')}</span> },
  ];

  const summaryCards = [
    { label: 'Total Estimated', value: `$${totalEstCost.toLocaleString()}`, color: '#1a73e8' },
    { label: 'Total Actual', value: `$${totalCost.toLocaleString()}`, color: '#00e676' },
    { label: 'Budget Utilization', value: totalEstCost > 0 ? `${Math.round((totalCost / totalEstCost) * 100)}%` : 'N/A', color: '#ffc107' },
    { label: 'Avg Cost/Order', value: workOrders.length > 0 ? `$${Math.round(totalEstCost / workOrders.length).toLocaleString()}` : '$0', color: '#ff9800' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiDollarSign style={{ marginRight: 10 }} />Cost Analysis</div>
          <div className="page-subtitle">Maintenance cost overview and AI optimization</div>
        </div>
        <button className="btn-primary" onClick={runOptimization} disabled={aiLoading} style={{ opacity: aiLoading ? 0.5 : 1 }}>
          <FiTrendingUp size={16} /> AI Cost Optimization
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {summaryCards.map(c => (
          <div key={c.label} className="card">
            <div style={{ fontSize: 12, color: '#607d8b', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Cost Breakdown Table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Cost Breakdown by Work Order</div>
        <DataTable columns={costColumns} data={workOrders} onRowClick={() => {}} />
      </div>

      {/* AI Result */}
      {(aiLoading || aiResult) && (
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiTrendingUp size={18} color="#1a73e8" /> AI Cost Optimization Recommendations
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      )}
    </div>
  );
};

export default CostAnalysis;
