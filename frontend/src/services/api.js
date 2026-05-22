import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3002/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// CRUD helpers
export const getAll = (resource, params) => api.get(`/${resource}`, { params });
export const getOne = (resource, id) => api.get(`/${resource}/${id}`);
export const create = (resource, data) => api.post(`/${resource}`, data);
export const update = (resource, id, data) => api.put(`/${resource}/${id}`, data);
export const remove = (resource, id) => api.delete(`/${resource}/${id}`);

export default api;
