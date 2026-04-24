import React from 'react';

const styles = {
  overlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    width: '100%',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #1a2332',
    borderTop: '4px solid #1a73e8',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  text: {
    marginLeft: 12,
    color: '#8899aa',
    fontSize: 14,
  },
};

const LoadingSpinner = ({ text = 'Loading...' }) => (
  <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={styles.overlay}>
      <div style={styles.spinner} />
      <span style={styles.text}>{text}</span>
    </div>
  </>
);

export default LoadingSpinner;
