import React, { useState, useEffect } from 'react';
import { FiHeart, FiPlay } from 'react-icons/fi';
import { getAll } from '../services/api';
import api from '../services/api';
import HealthScore from '../components/HealthScore';
import StatusBadge from '../components/StatusBadge';
import AIResultDisplay from '../components/AIResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';

const EquipmentHealth = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEq, setSelectedEq] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAll('equipment');
        const items = res.data.data || res.data || [];
        setEquipment(Array.isArray(items) ? items : []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const runHealthAssessment = async (eq) => {
    setSelectedEq(eq);
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/health-assessment', { equipment_id: eq.id });
      const d = res.data.data || res.data;
      setAiResult(d.analysis || d.result || d);
    } catch (err) {
      setAiResult('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><FiHeart style={{ marginRight: 10 }} />Equipment Health</div>
          <div className="page-subtitle">AI-powered health assessment for all equipment</div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        {equipment.map(eq => (
          <div
            key={eq.id}
            style={{
              backgroundColor: '#1a2332', borderRadius: 14, padding: 24,
              border: selectedEq?.id === eq.id ? '1px solid #1a73e8' : '1px solid #2a3a4a',
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
            }}
            onClick={() => setSelectedEq(eq)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = selectedEq?.id === eq.id ? '#1a73e8' : '#2a3a4a'; e.currentTarget.style.transform = 'none'; }}
          >
            <HealthScore score={eq.health_score || 0} size={90} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e0e0e0', marginTop: 12 }}>{eq.name}</div>
            <div style={{ fontSize: 12, color: '#607d8b', marginTop: 4 }}>{eq.type} - {eq.location}</div>
            <div style={{ marginTop: 10 }}>
              <StatusBadge status={eq.status || 'operational'} size="small" />
            </div>
            <button
              onClick={e => { e.stopPropagation(); runHealthAssessment(eq); }}
              style={{
                marginTop: 14, padding: '8px 16px', borderRadius: 8,
                border: '1px solid #1a73e8', backgroundColor: '#1a73e8' + '18',
                color: '#1a73e8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <FiPlay size={12} /> AI Assessment
            </button>
          </div>
        ))}
        {equipment.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#607d8b' }}>
            No equipment found.
          </div>
        )}
      </div>

      {/* AI Result */}
      {(aiLoading || aiResult) && (
        <div className="card">
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiHeart size={18} color="#00e676" /> Health Assessment
            {selectedEq && <span style={{ fontWeight: 400, color: '#8899aa' }}>- {selectedEq.name}</span>}
          </div>
          <AIResultDisplay result={aiResult} loading={aiLoading} />
        </div>
      )}
    </div>
  );
};

export default EquipmentHealth;
