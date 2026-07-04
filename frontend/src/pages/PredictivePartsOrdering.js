import React, { useState } from 'react';
import { FiShoppingCart, FiPlay } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PredictivePartsOrdering = () => {
  const [equipmentId, setEquipmentId] = useState('');
  const [leadBuffer, setLeadBuffer] = useState('14');
  const [lookahead, setLookahead] = useState('90');
  const [createOrders, setCreateOrders] = useState(true);
  const [dispatchOrders, setDispatchOrders] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRun = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        equipment_id: equipmentId ? Number(equipmentId) : undefined,
        lead_time_days_buffer: Number(leadBuffer) || 14,
        lookahead_days: Number(lookahead) || 90,
        create_procurement_orders: createOrders,
        dispatch_orders: dispatchOrders,
      };
      const res = await api.post('/ai/predictive-parts-ordering', payload);
      setResult(res.data?.data || res.data);
    } catch (err) {
      if (err.response?.status === 503) {
        setError(err.response?.data?.message || 'AI not configured (503). Set OPENROUTER_API_KEY in .env.');
      } else {
        setError(err.response?.data?.message || err.message || 'AI request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.analysis || {};
  const orderNow = parsed.order_now || [];
  const orderSoon = parsed.order_soon || [];
  const watchlist = parsed.watchlist || [];
  const procurementOrders = result?.procurement_orders || [];

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a3a4a', backgroundColor: '#0f1923', color: '#e0e0e0', fontSize: 14 };
  const labelStyle = { display: 'block', fontSize: 13, color: '#8899aa', marginBottom: 8 };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            <FiShoppingCart style={{ marginRight: 10 }} />
            Predictive Parts Ordering
          </div>
          <div className="page-subtitle">
            AI creates a parts-ordering plan, can create draft procurement orders, and can dispatch orders when the procurement connector is configured.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleRun} style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 160 }}>
            <label style={labelStyle}>Equipment ID (optional)</label>
            <input type="number" value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ width: 200 }}>
            <label style={labelStyle}>Lead-time Buffer (days)</label>
            <input type="number" value={leadBuffer} onChange={(e) => setLeadBuffer(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ width: 180 }}>
            <label style={labelStyle}>Lookahead (days)</label>
            <input type="number" value={lookahead} onChange={(e) => setLookahead(e.target.value)} style={inputStyle} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', paddingBottom: 10 }}>
            <input type="checkbox" checked={createOrders} onChange={(e) => setCreateOrders(e.target.checked)} />
            Create draft orders
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', paddingBottom: 10 }}>
            <input type="checkbox" checked={dispatchOrders} onChange={(e) => setDispatchOrders(e.target.checked)} disabled={!createOrders} />
            Dispatch to procurement
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            <FiPlay size={14} /> {loading ? 'Planning...' : 'Generate Plan'}
          </button>
        </form>
      </div>

      {error && (
        <div className="card" style={{ background: '#3b1f1f', color: '#fca5a5', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {result && !loading && (
        <>
          {parsed.estimated_total_spend !== undefined && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                Estimated Spend: <span style={{ color: '#1a73e8' }}>${parsed.estimated_total_spend}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8899aa' }}>
                {result.parts_evaluated} parts evaluated.
              </div>
            </div>
          )}

          {orderNow.length > 0 && (
            <Section title={`Order Now (${orderNow.length})`} color="#ff5252" rows={orderNow.map((r, i) => (
              <PartRow key={i} idx={i + 1}
                title={`#${r.part_id || '?'} ${r.part_number || ''}`}
                qty={r.suggested_qty}
                rationale={r.rationale}
                tag={r.urgency}
                tagColor={r.urgency === 'critical' ? '#ff5252' : '#ffc107'} />
            ))} />
          )}

          {orderSoon.length > 0 && (
            <Section title={`Order Soon (${orderSoon.length})`} color="#ffc107" rows={orderSoon.map((r, i) => (
              <PartRow key={i} idx={i + 1}
                title={`#${r.part_id || '?'} ${r.part_number || ''}`}
                qty={r.suggested_qty}
                rationale={r.rationale}
                tag={r.by_date}
                tagColor="#1a73e8" />
            ))} />
          )}

          {watchlist.length > 0 && (
            <Section title={`Watchlist (${watchlist.length})`} color="#1a73e8" rows={watchlist.map((r, i) => (
              <div key={i} style={{ padding: '8px 0', fontSize: 13, color: '#cbd5e1', borderBottom: i < watchlist.length - 1 ? '1px solid #1e2d3d' : 'none' }}>
                <strong style={{ color: '#fff' }}>Part {r.part_id}: </strong>{r.rationale}
              </div>
            ))} />
          )}

          {procurementOrders.length > 0 && (
            <Section title={`Procurement Orders Created (${procurementOrders.length})`} color="#8fd19e" rows={procurementOrders.map((order) => (
              <div key={order.id} style={{ padding: '10px 0', borderBottom: '1px solid #1e2d3d' }}>
                <div style={{ color: '#fff', fontWeight: 700 }}>Order #{order.id} · Part {order.spare_part_id}</div>
                <div style={{ color: '#8fa1b3', fontSize: 12 }}>
                  {order.supplier || 'Supplier TBD'} · qty {order.quantity} · ${Number(order.estimated_cost || 0).toLocaleString()} · {order.dispatch_status || order.status}
                </div>
                {order.dispatch_error && <div style={{ color: '#ff8a8a', fontSize: 12, marginTop: 4 }}>{order.dispatch_error}</div>}
              </div>
            ))} />
          )}

          {parsed.procurement_controls?.length > 0 && (
            <Section title="Procurement Controls" color="#8fa1b3" rows={parsed.procurement_controls.map((control, i) => (
              <div key={i} style={{ padding: '6px 0', color: '#cbd5e1', fontSize: 13 }}>{control}</div>
            ))} />
          )}
        </>
      )}
    </div>
  );
};

const Section = ({ title, color, rows }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 12 }}>{title}</div>
    {rows}
  </div>
);

const PartRow = ({ idx, title, qty, rationale, tag, tagColor }) => (
  <div style={{ padding: '10px 0', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid #1e2d3d' }}>
    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: '#1a73e818', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
      {idx}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
        {title}
        <span style={{ marginLeft: 10, fontSize: 12, color: '#8899aa' }}>qty {qty}</span>
        {tag && (
          <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 6px', borderRadius: 4, background: tagColor + '22', color: tagColor }}>
            {tag}
          </span>
        )}
      </div>
      {rationale && <div style={{ fontSize: 12, color: '#8899aa', marginTop: 4 }}>{rationale}</div>}
    </div>
  </div>
);

export default PredictivePartsOrdering;
