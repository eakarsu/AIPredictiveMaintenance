const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith('/api/')
    ? path.slice('/api'.length)
    : path;
  const separator = normalizedPath.startsWith('/') ? '' : '/';

  return fetch(`${API_BASE}${separator}${normalizedPath}`, options);
}
