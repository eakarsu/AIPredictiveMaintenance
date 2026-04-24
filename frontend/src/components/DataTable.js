import React, { useState, useMemo } from 'react';
import { FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const styles = {
  wrapper: { width: '100%' },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, flexWrap: 'wrap', gap: 12,
  },
  searchBox: {
    display: 'flex', alignItems: 'center', backgroundColor: '#0f1923',
    border: '1px solid #2a3a4a', borderRadius: 8, padding: '8px 12px', flex: '0 1 300px',
  },
  searchInput: {
    background: 'none', border: 'none', color: '#e0e0e0', fontSize: 14,
    outline: 'none', marginLeft: 8, width: '100%',
  },
  table: {
    width: '100%', borderCollapse: 'separate', borderSpacing: 0,
    backgroundColor: '#1a2332', borderRadius: 12, overflow: 'hidden',
  },
  th: {
    padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
    color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.5,
    borderBottom: '1px solid #2a3a4a', cursor: 'pointer', userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 16px', fontSize: 14, color: '#c0d0e0',
    borderBottom: '1px solid #1e2d3d',
  },
  tr: { cursor: 'pointer', transition: 'background 0.15s' },
  empty: { padding: 40, textAlign: 'center', color: '#607d8b', fontSize: 14 },
};

const DataTable = ({ columns, data = [], onRowClick, searchable = true, actions }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    let items = [...data];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(row =>
        columns.some(col => {
          const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
          return String(val || '').toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      items.sort((a, b) => {
        const col = columns.find(c => c.key === sortKey || c.accessor === sortKey);
        const aVal = col && typeof col.accessor === 'function' ? col.accessor(a) : a[sortKey];
        const bVal = col && typeof col.accessor === 'function' ? col.accessor(b) : b[sortKey];
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [data, search, sortKey, sortDir, columns]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.toolbar}>
        {searchable && (
          <div style={styles.searchBox}>
            <FiSearch color="#607d8b" size={16} />
            <input
              style={styles.searchInput}
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 12 }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map(col => {
                const key = col.key || col.accessor;
                return (
                  <th key={key} style={styles.th} onClick={() => handleSort(key)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.header}
                      {sortKey === key && (sortDir === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} style={styles.empty}>No data found</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id || i}
                  style={styles.tr}
                  onClick={() => onRowClick && onRowClick(row)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e2d3d'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {columns.map(col => {
                    const key = col.key || col.accessor;
                    const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
                    return (
                      <td key={key} style={styles.td}>
                        {col.render ? col.render(val, row) : (val != null ? String(val) : '-')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
