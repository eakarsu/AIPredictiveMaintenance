import React, { useEffect, useState } from 'react';
import api from '../services/api';
import FailureTimelineChart from '../components/FailureTimelineChart';
import HealthHeatmap from '../components/HealthHeatmap';
import WorkOrderPdfPanel from '../components/WorkOrderPdfPanel';
import ThresholdRulesEditor from '../components/ThresholdRulesEditor';

// Aggregator page that mounts the 4 PdM custom views.
const CustomViewsPage = () => {
  const [timeline, setTimeline] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [tl, hm] = await Promise.all([
          api.get('/custom-views/failure-timeline'),
          api.get('/custom-views/health-heatmap'),
        ]);
        if (cancelled) return;
        setTimeline(tl.data?.data || null);
        setHeatmap(hm.data?.data || null);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || 'Failed to load custom views');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: 24, color: '#e0e0e0' }} data-testid="custom-views-page">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 26, color: '#fff', fontWeight: 700 }}>
          PdM Custom Views
        </h1>
        <div style={{ marginTop: 6, color: '#8899aa', fontSize: 13 }}>
          Failure prediction timeline, equipment health heatmap, work order PDF, threshold rule editor.
        </div>
      </div>

      {error && (
        <div style={{
          padding: 14, marginBottom: 18, borderRadius: 10,
          backgroundColor: '#ff525218', color: '#ff5252',
          border: '1px solid #ff525244', fontSize: 13,
        }}>{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <section data-testid="section-failure-timeline">
          {loading && !timeline ? (
            <div style={{ padding: 20, color: '#8899aa', backgroundColor: '#1a2332', borderRadius: 12 }}>
              Loading failure timeline...
            </div>
          ) : (
            <FailureTimelineChart data={timeline} />
          )}
        </section>

        <section data-testid="section-health-heatmap">
          {loading && !heatmap ? (
            <div style={{ padding: 20, color: '#8899aa', backgroundColor: '#1a2332', borderRadius: 12 }}>
              Loading health heatmap...
            </div>
          ) : (
            <HealthHeatmap data={heatmap} />
          )}
        </section>

        <section data-testid="section-work-order-pdf">
          <WorkOrderPdfPanel />
        </section>

        <section data-testid="section-threshold-rules">
          <ThresholdRulesEditor />
        </section>
      </div>
    </div>
  );
};

export default CustomViewsPage;
