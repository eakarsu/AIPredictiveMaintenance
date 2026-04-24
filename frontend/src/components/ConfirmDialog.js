import React from 'react';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 2000,
  },
  dialog: {
    backgroundColor: '#1a2332', borderRadius: 12, padding: 32,
    width: 420, maxWidth: '90vw', border: '1px solid #2a3a4a',
  },
  title: { fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 12 },
  message: { fontSize: 14, color: '#8899aa', marginBottom: 24, lineHeight: 1.6 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 8, border: '1px solid #2a3a4a',
    backgroundColor: 'transparent', color: '#8899aa', cursor: 'pointer',
    fontSize: 14, fontWeight: 500,
  },
  confirmBtn: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    backgroundColor: '#ff5252', color: '#fff', cursor: 'pointer',
    fontSize: 14, fontWeight: 500,
  },
};

const ConfirmDialog = ({ open, title = 'Confirm', message = 'Are you sure?', onConfirm, onCancel, confirmText = 'Delete', confirmColor = '#ff5252' }) => {
  if (!open) return null;
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>{title}</div>
        <div style={styles.message}>{message}</div>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={{ ...styles.confirmBtn, backgroundColor: confirmColor }} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
