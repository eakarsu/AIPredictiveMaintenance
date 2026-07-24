import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn, FiZap, FiSettings } from 'react-icons/fi';

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0f1923',
    background: 'radial-gradient(ellipse at top, #111d2b 0%, #0f1923 70%)',
  },
  card: {
    width: 420, maxWidth: '92vw', backgroundColor: '#1a2332',
    borderRadius: 20, padding: 40, border: '1px solid #2a3a4a',
    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
  },
  logo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 12, marginBottom: 32,
  },
  logoIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#1a73e8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: 700, color: '#fff' },
  logoSub: { fontSize: 11, color: '#607d8b', letterSpacing: 1 },
  field: { marginBottom: 20 },
  label: {
    display: 'block', fontSize: 13, fontWeight: 500, color: '#8899aa',
    marginBottom: 8,
  },
  inputWrap: {
    display: 'flex', alignItems: 'center', backgroundColor: '#0f1923',
    border: '1px solid #2a3a4a', borderRadius: 10, padding: '0 14px',
  },
  input: {
    flex: 1, padding: '12px 10px', border: 'none', backgroundColor: 'transparent',
    color: '#e0e0e0', fontSize: 14, outline: 'none',
  },
  loginBtn: {
    width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
    backgroundColor: '#1a73e8', color: '#fff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 8,
  },
  demoBtn: {
    width: '100%', padding: '12px 0', borderRadius: 10,
    border: '1px solid #2a3a4a', backgroundColor: 'transparent',
    color: '#8899aa', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12,
  },
  error: {
    backgroundColor: '#ff525218', border: '1px solid #ff525244',
    borderRadius: 8, padding: '10px 14px', color: '#ff5252',
    fontSize: 13, marginBottom: 16,
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setEmail(process.env.REACT_APP_DEMO_EMAIL || '');
    setPassword(process.env.REACT_APP_DEMO_PASSWORD || '');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}><FiSettings size={24} color="#fff" /></div>
          <div>
            <div style={styles.logoText}>AI Maintenance</div>
            <div style={styles.logoSub}>PREDICTIVE PLATFORM</div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrap}>
              <FiMail size={16} color="#607d8b" />
              <input
                style={styles.input} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <FiLock size={16} color="#607d8b" />
              <input
                style={styles.input} type="password" placeholder="Enter password"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" style={{ ...styles.loginBtn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            <FiLogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button style={styles.demoBtn} onClick={handleDemo}>
          <FiZap size={14} /> Demo Login (auto-populate credentials)
        </button>
      </div>
    </div>
  );
};

export default Login;
