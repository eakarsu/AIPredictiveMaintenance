import React, { useState } from 'react';
import {
  FiAlertTriangle, FiCheckCircle, FiInfo, FiChevronDown,
  FiChevronRight, FiTarget, FiShield, FiTrendingUp, FiTool,
  FiZap, FiAlertCircle, FiList, FiActivity
} from 'react-icons/fi';

const sectionIcons = {
  'root cause': FiTarget,
  'impact': FiAlertTriangle,
  'corrective': FiTool,
  'prevention': FiShield,
  'recommendation': FiCheckCircle,
  'risk': FiAlertCircle,
  'assessment': FiActivity,
  'analysis': FiTrendingUp,
  'action': FiZap,
  'summary': FiInfo,
  'optimization': FiTrendingUp,
  'cost': FiTrendingUp,
  'default': FiList,
};

const getIconForSection = (title) => {
  const lower = title.toLowerCase();
  for (const [key, Icon] of Object.entries(sectionIcons)) {
    if (lower.includes(key)) return Icon;
  }
  return FiList;
};

const getRiskColor = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('very high') || lower.includes('severe')) return '#ff5252';
  if (lower.includes('high')) return '#ff9800';
  if (lower.includes('medium') || lower.includes('moderate')) return '#ffc107';
  if (lower.includes('low') || lower.includes('minimal')) return '#00e676';
  return '#1a73e8';
};

const parseAIResponse = (text) => {
  if (!text || typeof text !== 'string') return [];
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect section headers (lines starting with ## or ** or numbered with colon or all-caps short line)
    const headerMatch = trimmed.match(/^(?:#{1,3}\s*|(?:\d+\.\s*)?(?:\*\*|__)?)(.+?)(?:\*\*|__)?:?\s*$/);
    const isHeader = (
      trimmed.startsWith('##') ||
      trimmed.startsWith('**') ||
      (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes('.')) ||
      (trimmed === trimmed.toUpperCase() && trimmed.length < 60 && trimmed.length > 3)
    );

    if (isHeader) {
      const title = trimmed.replace(/^[#*_\d.]+\s*/, '').replace(/[*_:]+$/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      if (title.length > 2) {
        currentSection = { title, items: [] };
        sections.push(currentSection);
        return;
      }
    }

    if (!currentSection) {
      currentSection = { title: 'Summary', items: [] };
      sections.push(currentSection);
    }

    // Clean markdown-style formatting
    const cleaned = trimmed
      .replace(/^\*\*(.+?)\*\*/, '$1')
      .replace(/^[-*+]\s*/, '')
      .replace(/^\d+\.\s*/, '');

    if (cleaned) currentSection.items.push(cleaned);
  });

  return sections.length > 0 ? sections : [{ title: 'Analysis Result', items: [text] }];
};

const Section = ({ section }) => {
  const [expanded, setExpanded] = useState(true);
  const Icon = getIconForSection(section.title);
  const riskColor = getRiskColor(section.title);

  return (
    <div style={{
      backgroundColor: '#0f1923', borderRadius: 12, marginBottom: 12,
      border: '1px solid #2a3a4a', overflow: 'hidden',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', padding: '14px 18px',
          cursor: 'pointer', gap: 12,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: riskColor + '18', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={riskColor} />
        </div>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#e0e0e0' }}>
          {section.title}
        </span>
        <span style={{ color: '#607d8b' }}>
          {expanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
        </span>
      </div>
      {expanded && section.items.length > 0 && (
        <div style={{ padding: '0 18px 16px 66px' }}>
          {section.items.map((item, i) => {
            // Check for key-value format
            const kvMatch = item.match(/^(.+?):\s*(.+)$/);
            if (kvMatch && kvMatch[1].length < 40) {
              return (
                <div key={i} style={{
                  display: 'flex', gap: 8, padding: '6px 0',
                  borderBottom: '1px solid #1e2d3d',
                }}>
                  <span style={{ fontWeight: 600, color: '#8899aa', fontSize: 13, minWidth: 120 }}>
                    {kvMatch[1]}
                  </span>
                  <span style={{
                    color: '#e0e0e0', fontSize: 13,
                    backgroundColor: getRiskColor(kvMatch[2]) + '18',
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {kvMatch[2]}
                  </span>
                </div>
              );
            }
            return (
              <div key={i} style={{
                padding: '5px 0', fontSize: 13, color: '#c0d0e0',
                lineHeight: 1.6, display: 'flex', gap: 8,
              }}>
                <span style={{ color: '#1a73e8', marginTop: 2 }}>&#8226;</span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const formatKeyLabel = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
};

const renderJsonValue = (value, depth = 0) => {
  if (value === null || value === undefined) {
    return <span style={{ color: '#607d8b', fontStyle: 'italic' }}>N/A</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span style={{
        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
        backgroundColor: value ? '#00e67618' : '#ff525218',
        color: value ? '#00e676' : '#ff5252',
      }}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span style={{ fontWeight: 700, color: '#e0e0e0', fontSize: 14 }}>{value}</span>;
  }

  if (typeof value === 'string') {
    if (value.length > 120) {
      return <span style={{ color: '#c0d0e0', fontSize: 13, lineHeight: 1.6 }}>{value}</span>;
    }
    const riskColor = getRiskColor(value);
    return (
      <span style={{
        color: '#e0e0e0', fontSize: 13,
        backgroundColor: riskColor + '18',
        padding: '2px 8px', borderRadius: 4,
      }}>
        {value}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span style={{ color: '#607d8b', fontStyle: 'italic' }}>None</span>;
    }
    return (
      <div style={{ paddingLeft: depth > 0 ? 0 : 0 }}>
        {value.map((item, i) => (
          <div key={i} style={{
            padding: '5px 0', fontSize: 13, color: '#c0d0e0',
            lineHeight: 1.6, display: 'flex', gap: 8,
          }}>
            <span style={{ color: '#1a73e8', marginTop: 2, flexShrink: 0 }}>&#8226;</span>
            <span>{typeof item === 'object' ? renderJsonValue(item, depth + 1) : String(item)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return (
      <div style={{ paddingLeft: depth > 0 ? 12 : 0, borderLeft: depth > 0 ? '2px solid #2a3a4a' : 'none' }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', gap: 8, padding: '4px 0',
            borderBottom: '1px solid #1e2d3d',
          }}>
            <span style={{ fontWeight: 600, color: '#8899aa', fontSize: 12, minWidth: 100 }}>
              {formatKeyLabel(k)}
            </span>
            <span style={{ flex: 1 }}>{renderJsonValue(v, depth + 1)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span style={{ color: '#c0d0e0', fontSize: 13 }}>{String(value)}</span>;
};

const renderJsonResult = (obj) => {
  const skipKeys = ['score'];
  const entries = Object.entries(obj).filter(([k]) => !skipKeys.includes(k));

  return (
    <div>
      {entries.map(([key, value]) => {
        const Icon = getIconForSection(formatKeyLabel(key));
        const riskColor = getRiskColor(formatKeyLabel(key));
        const isSimple = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null;

        return (
          <div key={key} style={{
            backgroundColor: '#0f1923', borderRadius: 12, marginBottom: 12,
            border: '1px solid #2a3a4a', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', padding: '14px 18px', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: riskColor + '18', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color={riskColor} />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#e0e0e0' }}>
                {formatKeyLabel(key)}
              </span>
              {isSimple && (
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {renderJsonValue(value)}
                </span>
              )}
            </div>
            {!isSimple && value !== null && value !== undefined && (
              <div style={{ padding: '0 18px 16px 66px' }}>
                {renderJsonValue(value)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const AIResultDisplay = ({ result, loading }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 48, gap: 16,
      }}>
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
          @keyframes spin2 { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{
          width: 48, height: 48, border: '4px solid #1a2332',
          borderTop: '4px solid #1a73e8', borderRadius: '50%',
          animation: 'spin2 0.8s linear infinite',
        }} />
        <div style={{ color: '#8899aa', fontSize: 14 }}>AI is analyzing...</div>
        <div style={{
          display: 'flex', gap: 6, animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1a73e8',
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!result) return null;

  // Handle object results (parsed JSON)
  if (typeof result === 'object' && !Array.isArray(result)) {
    // Check if the object has structured keys that look like an AI JSON response
    // (i.e., not just { analysis: "text string", score: 5 } wrappers)
    const wrapperKeys = ['analysis', 'result', 'data', 'message', 'score'];
    const allKeys = Object.keys(result);
    const hasStructuredData = allKeys.some(k => !wrapperKeys.includes(k)) || allKeys.length > 3;

    if (hasStructuredData) {
      return (
        <div>
          {result.score !== undefined && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
              padding: 16, backgroundColor: '#0f1923', borderRadius: 12,
              border: '1px solid #2a3a4a',
            }}>
              <div style={{
                fontSize: 36, fontWeight: 700,
                color: result.score >= 80 ? '#00e676' : result.score >= 60 ? '#ffc107' : '#ff5252',
              }}>
                {result.score}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>Overall Score</div>
                <div style={{ fontSize: 12, color: '#8899aa' }}>AI-generated assessment score</div>
              </div>
            </div>
          )}
          {renderJsonResult(result)}
        </div>
      );
    }

    const text = result.analysis || result.result || result.data || result.message || JSON.stringify(result, null, 2);
    const sections = parseAIResponse(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    return (
      <div>
        {result.score !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
            padding: 16, backgroundColor: '#0f1923', borderRadius: 12,
            border: '1px solid #2a3a4a',
          }}>
            <div style={{
              fontSize: 36, fontWeight: 700,
              color: result.score >= 80 ? '#00e676' : result.score >= 60 ? '#ffc107' : '#ff5252',
            }}>
              {result.score}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>Overall Score</div>
              <div style={{ fontSize: 12, color: '#8899aa' }}>AI-generated assessment score</div>
            </div>
          </div>
        )}
        {sections.map((s, i) => <Section key={i} section={s} />)}
      </div>
    );
  }

  // String result
  const sections = parseAIResponse(String(result));
  return (
    <div>{sections.map((s, i) => <Section key={i} section={s} />)}</div>
  );
};

export default AIResultDisplay;
