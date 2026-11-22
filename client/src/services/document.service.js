import { api } from './api.js';

export const documentService = {
  list: ({ search = '', type = '', page = 1, limit = 20, sort = 'created_at_desc' } = {}) => {
    const params = new URLSearchParams({ search, type, page, limit, sort });
    return api.get(`/documents?${params}`);
  },
  export: ({ search = '', type = '', sort = 'created_at_desc' } = {}) => {
    const params = new URLSearchParams({ search, type, sort });
    return api.get(`/documents/export?${params}`);
  },
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
};
