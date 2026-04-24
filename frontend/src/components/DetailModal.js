import React from 'react';
import { FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1a2332', borderRadius: 16, width: 640,
    maxWidth: '92vw', maxHeight: '85vh', overflow: 'auto',
    border: '1px solid #2a3a4a', position: 'relative',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #2a3a4a',
    position: 'sticky', top: 0, backgroundColor: '#1a2332', zIndex: 1,
  },
  title: { fontSize: 18, fontWeight: 600, color: '#fff' },
  closeBtn: {
    background: 'none', border: 'none', color: '#607d8b',
    cursor: 'pointer', padding: 4, display: 'flex',
  },
  body: { padding: 24 },
  row: {
    display: 'flex', padding: '10px 0', borderBottom: '1px solid #1e2d3d',
  },
  label: {
    width: 160, minWidth: 160, fontSize: 13, fontWeight: 500,
    color: '#8899aa', textTransform: 'uppercase', letterSpacing: 0.3,
  },
  value: { fontSize: 14, color: '#e0e0e0', flex: 1, wordBreak: 'break-word' },
  actions: {
    display: 'flex', gap: 10, padding: '16px 24px',
    borderTop: '1px solid #2a3a4a', justifyContent: 'flex-end',
  },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    borderRadius: 8, border: '1px solid #1a73e8', backgroundColor: 'transparent',
    color: '#1a73e8', cursor: 'pointer', fontSize: 14, fontWeight: 500,
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    borderRadius: 8, border: '1px solid #ff5252', backgroundColor: 'transparent',
    color: '#ff5252', cursor: 'pointer', fontSize: 14, fontWeight: 500,
  },
};

const DetailModal = ({ open, title, data = {}, fields = [], onClose, onEdit, onDelete, children }) => {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>{title}</div>
          <button style={styles.closeBtn} onClick={onClose}><FiX size={20} /></button>
        </div>
        <div style={styles.body}>
          {fields.map(f => (
            <div key={f.key} style={styles.row}>
              <div style={styles.label}>{f.label}</div>
              <div style={styles.value}>
                {f.render ? f.render(data[f.key], data) : (data[f.key] != null ? String(data[f.key]) : '-')}
              </div>
            </div>
          ))}
          {children}
        </div>
        {(onEdit || onDelete) && (
          <div style={styles.actions}>
            {onEdit && (
              <button style={styles.editBtn} onClick={() => onEdit(data)}>
                <FiEdit2 size={14} /> Edit
              </button>
            )}
            {onDelete && (
              <button style={styles.deleteBtn} onClick={() => onDelete(data)}>
                <FiTrash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailModal;
