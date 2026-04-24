import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    backgroundColor: '#1a2332', borderRadius: 16, width: 560,
    maxWidth: '92vw', maxHeight: '85vh', overflow: 'auto',
    border: '1px solid #2a3a4a',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #2a3a4a',
  },
  title: { fontSize: 18, fontWeight: 600, color: '#fff' },
  closeBtn: {
    background: 'none', border: 'none', color: '#607d8b',
    cursor: 'pointer', padding: 4, display: 'flex',
  },
  body: { padding: 24 },
  field: { marginBottom: 18 },
  label: {
    display: 'block', fontSize: 13, fontWeight: 500, color: '#8899aa',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3,
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #2a3a4a', backgroundColor: '#0f1923',
    color: '#e0e0e0', fontSize: 14, outline: 'none',
  },
  select: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #2a3a4a', backgroundColor: '#0f1923',
    color: '#e0e0e0', fontSize: 14, outline: 'none',
  },
  textarea: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #2a3a4a', backgroundColor: '#0f1923',
    color: '#e0e0e0', fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical',
  },
  actions: {
    display: 'flex', gap: 10, padding: '16px 24px',
    borderTop: '1px solid #2a3a4a', justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 8, border: '1px solid #2a3a4a',
    backgroundColor: 'transparent', color: '#8899aa', cursor: 'pointer',
    fontSize: 14, fontWeight: 500,
  },
  submitBtn: {
    padding: '10px 24px', borderRadius: 8, border: 'none',
    backgroundColor: '#1a73e8', color: '#fff', cursor: 'pointer',
    fontSize: 14, fontWeight: 500,
  },
  error: { color: '#ff5252', fontSize: 12, marginTop: 4 },
};

const FormModal = ({ open, title, fields = [], initialData = {}, onSubmit, onClose, submitText = 'Save' }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const defaults = {};
      fields.forEach(f => {
        defaults[f.key] = initialData[f.key] !== undefined ? initialData[f.key] : (f.defaultValue || '');
      });
      setFormData(defaults);
      setErrors({});
    }
  }, [open, initialData, fields]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    fields.forEach(f => {
      if (f.required && !formData[f.key] && formData[f.key] !== 0) {
        errs[f.key] = `${f.label} is required`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>{title}</div>
          <button style={styles.closeBtn} onClick={onClose}><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            {fields.map(f => (
              <div key={f.key} style={styles.field}>
                <label style={styles.label}>{f.label}{f.required && ' *'}</label>
                {f.type === 'select' ? (
                  <select
                    style={styles.select}
                    value={formData[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {(f.options || []).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    style={styles.textarea}
                    value={formData[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    style={styles.input}
                    type={f.type || 'text'}
                    value={formData[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                  />
                )}
                {errors[f.key] && <div style={styles.error}>{errors[f.key]}</div>}
              </div>
            ))}
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={{ ...styles.submitBtn, opacity: submitting ? 0.6 : 1 }} disabled={submitting}>
              {submitting ? 'Saving...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
