import React, { useEffect, useState } from 'react';
import { FiBell, FiCloud, FiCpu, FiRefreshCw, FiSend, FiShoppingCart } from 'react-icons/fi';
import api from '../services/api';

const sectionStyle = { display: 'grid', gap: 14 };
const panelStyle = { background: '#111a24', border: '1px solid #263647', borderRadius: 10, padding: 14 };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #2a3a4a', background: '#0f1923', color: '#e0e0e0' };
const labelStyle = { display: 'block', color: '#8fa1b3', fontSize: 12, marginBottom: 6 };

const StatusPill = ({ active }) => (
  <span style={{
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    color: active ? '#8fd19e' : '#ffd166',
    background: active ? '#4caf5022' : '#ffc10722',
  }}>
    {active ? 'Configured' : 'Needs env'}
  </span>
);

const IntegrationCenter = () => {
  const [status, setStatus] = useState({});
  const [devices, setDevices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [message, setMessage] = useState('');
  const [pushForm, setPushForm] = useState({ provider: 'onesignal', title: 'Maintenance Alert', message: 'A new maintenance event requires review.' });

  const load = async () => {
    setMessage('');
    const [cmms, iot, procurement, push, deviceRes, orderRes, subRes] = await Promise.all([
      api.get('/cmms/_/providers').catch((err) => ({ data: { data: { error: err.message } } })),
      api.get('/iot/_/providers').catch((err) => ({ data: { data: { error: err.message } } })),
      api.get('/procurement/_/providers').catch((err) => ({ data: { data: { error: err.message } } })),
      api.get('/push/_/providers').catch((err) => ({ data: { data: { error: err.message } } })),
      api.get('/iot/devices').catch(() => ({ data: { data: [] } })),
      api.get('/procurement/orders').catch(() => ({ data: { data: [] } })),
      api.get('/push/subscriptions').catch(() => ({ data: { data: [] } })),
    ]);
    setStatus({ cmms: cmms.data.data, iot: iot.data.data, procurement: procurement.data.data, push: push.data.data });
    setDevices(deviceRes.data.data || []);
    setOrders(orderRes.data.data || []);
    setSubscriptions(subRes.data.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const runCmmsSync = async () => {
    try {
      const res = await api.post('/cmms/sync/work-orders', { limit: 10 });
      setMessage(`CMMS sync completed: ${res.data.sent || 0} sent, ${res.data.failed || 0} failed.`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'CMMS sync failed');
    }
  };

  const dispatchOrder = async (id) => {
    try {
      await api.post(`/procurement/orders/${id}/dispatch`);
      setMessage(`Procurement order ${id} dispatched.`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Procurement dispatch failed');
    }
  };

  const sendPush = async (e) => {
    e.preventDefault();
    try {
      await api.post('/push/send', { ...pushForm, payload: { source: 'integration_center' } });
      setMessage('Push notification sent.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || 'Push notification failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiCloud style={{ marginRight: 10 }} /> Integration Center</div>
          <div className="page-subtitle">CMMS, IoT, procurement, and mobile push operations backed by persisted integration events.</div>
        </div>
        <button className="btn-secondary" onClick={load}><FiRefreshCw /> Refresh</button>
      </div>

      {message && <div className="card" style={{ color: '#cbd5e1', marginBottom: 16 }}>{message}</div>}

      <div className="cards-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: '#fff' }}>IBM Maximo</strong>
            <StatusPill active={status.cmms?.maximo} />
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: '#fff' }}>SAP PM</strong>
            <StatusPill active={status.cmms?.sap_pm} />
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: '#fff' }}>Procurement API</strong>
            <StatusPill active={status.procurement?.generic_http} />
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ color: '#fff' }}>Push Providers</strong>
            <StatusPill active={status.push?.available} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="card" style={sectionStyle}>
          <h3 style={{ margin: 0, color: '#fff' }}><FiCpu /> CMMS Work Orders</h3>
          <p style={{ margin: 0, color: '#8fa1b3', fontSize: 13 }}>Sync open work orders to the configured Maximo or SAP PM endpoint.</p>
          <button className="btn-primary" onClick={runCmmsSync}><FiSend /> Sync Work Orders</button>
        </div>

        <div className="card" style={sectionStyle}>
          <h3 style={{ margin: 0, color: '#fff' }}><FiBell /> Mobile Push</h3>
          <form onSubmit={sendPush} style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={labelStyle}>Provider</label>
              <select style={inputStyle} value={pushForm.provider} onChange={(e) => setPushForm({ ...pushForm, provider: e.target.value })}>
                <option value="onesignal">OneSignal</option>
                <option value="firebase">Firebase</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={pushForm.title} onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea style={{ ...inputStyle, minHeight: 74 }} value={pushForm.message} onChange={(e) => setPushForm({ ...pushForm, message: e.target.value })} />
            </div>
            <button className="btn-primary" type="submit"><FiSend /> Send Push</button>
          </form>
          <div style={{ color: '#8fa1b3', fontSize: 12 }}>{subscriptions.length} registered subscriptions</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0, color: '#fff' }}><FiCloud /> IoT Devices</h3>
          <div style={{ ...sectionStyle }}>
            {devices.slice(0, 8).map((device) => (
              <div key={device.id} style={panelStyle}>
                <div style={{ color: '#fff', fontWeight: 700 }}>{device.device_id}</div>
                <div style={{ color: '#8fa1b3', fontSize: 12 }}>{device.provider} · equipment {device.equipment_id || 'unlinked'} · {device.status}</div>
              </div>
            ))}
            {devices.length === 0 && <div style={{ color: '#8fa1b3' }}>No IoT devices registered.</div>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, color: '#fff' }}><FiShoppingCart /> Procurement Orders</h3>
          <div style={{ ...sectionStyle }}>
            {orders.slice(0, 8).map((order) => (
              <div key={order.id} style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700 }}>{order.part_name || `Part ${order.spare_part_id}`}</div>
                    <div style={{ color: '#8fa1b3', fontSize: 12 }}>{order.supplier || 'Supplier TBD'} · qty {order.quantity} · ${Number(order.estimated_cost || 0).toLocaleString()}</div>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>{order.status}</span>
                </div>
                {order.status !== 'dispatched' && <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => dispatchOrder(order.id)}>Dispatch</button>}
              </div>
            ))}
            {orders.length === 0 && <div style={{ color: '#8fa1b3' }}>No procurement orders yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationCenter;
