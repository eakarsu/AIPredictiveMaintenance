import React, { useState } from 'react';
import { FiCalendar, FiPlay, FiAlertTriangle, FiClock, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const MaintenanceWindowPlanner = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runPlanner = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.post('/ai/plan-windows');
      setResult(res.data.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (str) => {
    if (!str) return '-';
    try { return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return str; }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiCalendar className="text-3xl text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Window Planner</h1>
            <p className="text-gray-500 text-sm">AI-scheduled maintenance windows based on equipment health and schedules</p>
          </div>
        </div>
        <button
          onClick={runPlanner}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiPlay />
          {loading ? 'Planning...' : 'Generate Plan'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Analyzing equipment health, schedules, and generating maintenance windows...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <FiAlertTriangle className="text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Summary */}
          {(result.total_maintenance_hours != null || result.equipment_count != null || result.optimization_score != null) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.total_maintenance_hours != null && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Total Maintenance Hours</p>
                  <p className="text-2xl font-bold text-indigo-600">{result.total_maintenance_hours}h</p>
                </div>
              )}
              {result.equipment_count != null && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Equipment Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">{result.equipment_count}</p>
                </div>
              )}
              {result.optimization_score != null && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Schedule Efficiency</p>
                  <p className="text-2xl font-bold text-green-600">{result.optimization_score}</p>
                </div>
              )}
            </div>
          )}

          {/* Immediate Actions */}
          {result.immediate_actions?.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
                <FiAlertTriangle className="text-red-600" />
                <h2 className="font-semibold text-red-800">Immediate Actions Required</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {result.immediate_actions.map((item, i) => (
                  <li key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.equipment || item.equipment_name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{item.action || item.description}</p>
                        {item.reason && <p className="text-xs text-red-500 mt-1">{item.reason}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ml-4 flex-shrink-0 ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.high}`}>
                        {item.priority || 'urgent'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scheduled Windows */}
          {result.scheduled_windows?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                <FiClock className="text-indigo-600" />
                <h2 className="font-semibold text-gray-800">Scheduled Maintenance Windows</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {result.scheduled_windows.map((win, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium text-gray-900">{win.equipment || win.equipment_name}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[win.priority] || PRIORITY_COLORS.medium}`}>
                            {win.priority || 'scheduled'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{win.maintenance_type || win.type}</p>
                        {win.tasks?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {win.tasks.map((t, ti) => (
                              <li key={ti} className="text-xs text-gray-500 flex items-center gap-1">
                                <FiCheckCircle className="text-green-400 flex-shrink-0" />
                                {typeof t === 'string' ? t : t.task || JSON.stringify(t)}
                              </li>
                            ))}
                          </ul>
                        )}
                        {win.notes && <p className="text-xs text-gray-400 mt-1 italic">{win.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-indigo-700">{formatDate(win.suggested_date || win.start_date)}</p>
                        {win.duration_hours && <p className="text-xs text-gray-500">{win.duration_hours}h window</p>}
                        {win.health_score != null && (
                          <p className="text-xs mt-1">
                            Health: <span className={win.health_score < 50 ? 'text-red-500 font-semibold' : win.health_score < 75 ? 'text-yellow-500 font-semibold' : 'text-green-500 font-semibold'}>
                              {win.health_score}%
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Opportunities */}
          {result.optimization_opportunities?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-green-50 px-5 py-3 border-b border-green-200">
                <h2 className="font-semibold text-green-800">Optimization Opportunities</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {result.optimization_opportunities.map((opp, i) => (
                  <li key={i} className="px-5 py-3 text-sm text-gray-700">
                    {typeof opp === 'string' ? opp : opp.description || opp.opportunity || JSON.stringify(opp)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* General Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">General Recommendations</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="px-5 py-3 text-sm text-gray-700">
                    {typeof rec === 'string' ? rec : rec.recommendation || rec.description || JSON.stringify(rec)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JSON fallback */}
          {!result.scheduled_windows && !result.immediate_actions && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-3">AI Plan</h2>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiCalendar className="text-6xl mb-4 opacity-30" />
          <p className="text-lg font-medium">Click "Generate Plan" to create an AI maintenance schedule</p>
          <p className="text-sm mt-1">The AI analyzes equipment health scores, open maintenance schedules, and alert patterns</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceWindowPlanner;
