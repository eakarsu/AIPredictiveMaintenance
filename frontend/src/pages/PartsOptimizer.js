import AIResultDisplay from '../components/AIResultDisplay';
import React, { useState } from 'react';
import { FiPackage, FiPlay, FiAlertTriangle, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PartsOptimizer = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runOptimizer = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.post('/ai/parts-optimizer');
      setResult(res.data.data || res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return '-';
    return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiPackage className="text-3xl text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Spare Parts Optimizer</h1>
            <p className="text-gray-500 text-sm">AI-powered inventory optimization and procurement recommendations</p>
          </div>
        </div>
        <button
          onClick={runOptimizer}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiPlay />
          {loading ? 'Analyzing...' : 'Run Optimizer'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Analyzing inventory levels, failure patterns, and procurement costs...</p>
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
          {/* Summary Metrics */}
          {result.total_investment_needed != null && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Total Investment Needed</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.total_investment_needed)}</p>
              </div>
              {result.potential_downtime_prevented_hours != null && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Downtime Hours Prevented</p>
                  <p className="text-2xl font-bold text-green-600">{result.potential_downtime_prevented_hours}h</p>
                </div>
              )}
              {result.roi_estimate != null && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Estimated ROI</p>
                  <p className="text-2xl font-bold text-purple-600">{result.roi_estimate}</p>
                </div>
              )}
            </div>
          )}

          {/* Critical Shortages */}
          {result.critical_shortages?.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-red-50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
                <FiAlertTriangle className="text-red-600" />
                <h2 className="font-semibold text-red-800">Critical Shortages ({result.critical_shortages.length})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {result.critical_shortages.map((item, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.part_name || item.part}</p>
                      <p className="text-sm text-gray-500">{item.equipment_affected || item.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                        Stock: {item.current_stock ?? item.stock ?? 0}
                      </span>
                      {item.recommended_stock != null && (
                        <p className="text-xs text-gray-500 mt-1">Recommended: {item.recommended_stock}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Table */}
          {result.recommendations?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800">Procurement Recommendations</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-gray-600 font-medium">Part</th>
                      <th className="text-left px-5 py-3 text-gray-600 font-medium">Action</th>
                      <th className="text-right px-5 py-3 text-gray-600 font-medium">Quantity</th>
                      <th className="text-right px-5 py-3 text-gray-600 font-medium">Est. Cost</th>
                      <th className="text-left px-5 py-3 text-gray-600 font-medium">Priority</th>
                      <th className="text-left px-5 py-3 text-gray-600 font-medium">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.recommendations.map((rec, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{rec.part_name || rec.part}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                            rec.action === 'order' || rec.action === 'purchase'
                              ? 'bg-blue-100 text-blue-700'
                              : rec.action === 'reorder'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {rec.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">{rec.quantity ?? rec.qty ?? '-'}</td>
                        <td className="px-5 py-3 text-right">{formatCurrency(rec.estimated_cost || rec.cost)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold ${
                            rec.priority === 'high' || rec.priority === 'critical'
                              ? 'text-red-600'
                              : rec.priority === 'medium'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            {rec.priority || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{rec.rationale || rec.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Overstock Items */}
          {result.overstock_items?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-yellow-50 px-5 py-3 border-b border-yellow-200 flex items-center gap-2">
                <FiTrendingDown className="text-yellow-600" />
                <h2 className="font-semibold text-yellow-800">Overstock Items — Consider Redistribution</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {result.overstock_items.map((item, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.part_name || item.part}</p>
                      <p className="text-sm text-gray-500">{item.recommendation || item.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">Stock: {item.current_stock ?? item.stock}</p>
                      {item.excess_value != null && (
                        <p className="text-xs text-yellow-600">Excess value: {formatCurrency(item.excess_value)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Recommendations */}
          {result.supplier_recommendations?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                <FiTrendingUp className="text-blue-600" />
                <h2 className="font-semibold text-gray-800">Supplier Recommendations</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {result.supplier_recommendations.map((s, i) => (
                  <li key={i} className="px-5 py-3 text-sm text-gray-700">{typeof s === 'string' ? s : s.recommendation || JSON.stringify(s)}</li>
                ))}
              </ul>
            </div>
          )}

          {!result.recommendations && !result.critical_shortages && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-3">AI Analysis</h2>
              <AIResultDisplay result={result} />
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiPackage className="text-6xl mb-4 opacity-30" />
          <p className="text-lg font-medium">Click "Run Optimizer" to analyze your spare parts inventory</p>
          <p className="text-sm mt-1">The AI will review stock levels, failure patterns, and generate procurement recommendations</p>
        </div>
      )}
    </div>
  );
};

export default PartsOptimizer;
