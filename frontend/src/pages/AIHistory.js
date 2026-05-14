import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const AIHistory = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const loadHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/ai/history?page=${page}&limit=20`);
      const d = res.data;
      setData(d.data || []);
      setPagination(d.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('AI history load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(1); }, [loadHistory]);

  const endpointColors = {
    'predict-failure': '#ff5252',
    'health-assessment': '#00e676',
    'anomaly-detection': '#ffc107',
    'maintenance-recommendation': '#1a73e8',
    'cost-optimization': '#9c27b0',
    'root-cause-analysis': '#ff9800',
    'what-if-simulation': '#00bcd4',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">AI Prediction History</div>
          <div className="page-subtitle">Past AI analyses and predictions</div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading AI history..." />
      ) : (
        <>
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2d3d' }}>
                  {['Endpoint', 'Equipment', 'Date', 'Summary'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#607d8b', fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#607d8b' }}>
                      No AI prediction history yet. Run an analysis to see results here.
                    </td>
                  </tr>
                ) : data.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(selected?.id === row.id ? null : row)}
                    style={{
                      borderBottom: '1px solid #1e2d3d', cursor: 'pointer',
                      backgroundColor: selected?.id === row.id ? '#1e2d3d' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e2d3d'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = selected?.id === row.id ? '#1e2d3d' : 'transparent'}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                        backgroundColor: (endpointColors[row.endpoint] || '#607d8b') + '22',
                        color: endpointColors[row.endpoint] || '#607d8b',
                      }}>
                        {row.endpoint}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#c0d0e0', fontSize: 13 }}>
                      {row.equipment_name || (row.equipment_id ? `Equipment #${row.equipment_id}` : 'N/A')}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#607d8b', fontSize: 12 }}>
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#8899aa', fontSize: 12 }}>
                      {row.result?.summary || row.result?.assessment?.summary || 'Click to view details'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => loadHistory(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #2a3a4a',
                  backgroundColor: '#1a2332', color: pagination.page <= 1 ? '#3a4a5a' : '#fff',
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <FiChevronLeft size={14} /> Prev
              </button>
              <span style={{ color: '#607d8b', fontSize: 13 }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => loadHistory(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #2a3a4a',
                  backgroundColor: '#1a2332', color: pagination.page >= pagination.totalPages ? '#3a4a5a' : '#fff',
                  cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                Next <FiChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Detail panel */}
          {selected && (
            <div className="card" style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                  Result: {selected.endpoint} — {selected.equipment_name || 'N/A'}
                </div>
                <div style={{ color: '#607d8b', fontSize: 12 }}>{new Date(selected.created_at).toLocaleString()}</div>
              </div>
              <pre style={{
                backgroundColor: '#0f1923', padding: 16, borderRadius: 8,
                color: '#c0d0e0', fontSize: 12, overflow: 'auto', maxHeight: 400,
              }}>
                {JSON.stringify(selected.result, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIHistory;
