import React, { useState } from 'react';
import api from '../services/api';

// NON-VIZ component #1: Maintenance Work Order PDF
// Lets the user enter / pick a work order id and open the PDF for that work order.
// Hits GET /custom-views/work-order-pdf/:id with auth header, then opens the blob in a new tab.

const WorkOrderPdfPanel = () => {
  const [workOrderId, setWorkOrderId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastStatus, setLastStatus] = useState(null);

  const generate = async () => {
    if (!workOrderId) {
      setError('Please enter a work order id.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const resp = await api.get(`/custom-views/work-order-pdf/${encodeURIComponent(workOrderId)}`, {
        responseType: 'blob',
      });
      setLastStatus(resp.status);
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      // Give the browser a moment before revoke
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1a2332', borderRadius: 12, padding: 20, border: '1px solid #2a3a4a' }}>
      <div style={{ marginBottom: 12, color: '#fff', fontWeight: 600, fontSize: 15 }}>
        Maintenance Work Order PDF
      </div>
      <div style={{ color: '#8899aa', fontSize: 12, marginBottom: 14 }}>
        Generate a printable work order document for a given work order. Returns PDF (or text fallback if pdfkit not installed).
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ color: '#8899aa', fontSize: 13 }}>Work Order ID:</label>
        <input
          type="text"
          value={workOrderId}
          onChange={e => setWorkOrderId(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8, backgroundColor: '#0f1923',
            border: '1px solid #2a3a4a', color: '#e0e0e0', fontSize: 13, width: 160,
            outline: 'none',
          }}
        />
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            backgroundColor: '#1a73e8', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Generating...' : 'Generate PDF'}
        </button>
        {lastStatus && (
          <span style={{ color: '#4caf50', fontSize: 12 }}>HTTP {lastStatus}</span>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 8,
          backgroundColor: '#ff525218', color: '#ff5252', fontSize: 13,
          border: '1px solid #ff525244',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default WorkOrderPdfPanel;
