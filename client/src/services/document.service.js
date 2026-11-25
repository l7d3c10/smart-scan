import { api } from './api.js';

export const documentService = {
  list: ({ search = '', type = '', page = 1, limit = 10, sort = 'created_at_desc', isFavorite, isDeleted, folderName } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (sort) params.set('sort', sort);
    if (isFavorite !== undefined) params.set('isFavorite', isFavorite);
    if (isDeleted !== undefined) params.set('isDeleted', isDeleted);
    if (folderName) params.set('folderName', folderName);
    return api.get(`/documents?${params.toString()}`);
  },
  nextCode: () => api.get('/documents/next-code'),
  folders: () => api.get('/documents/folders'),
  createFolder: (data) => api.post('/documents/folders', data),
  deleteFolder: (name) => api.delete(`/documents/folders/${encodeURIComponent(name)}`),
  get: (id) => api.get(`/documents/${id}`),
  history: (id) => api.get(`/documents/${id}/history`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  bulkDelete: (ids) => api.post('/documents/bulk-delete', { ids }),
  copy: (id) => api.post(`/documents/${id}/copy`),
  bulkCopy: (ids) => api.post('/documents/bulk-copy', { ids }),
  import: (items) => api.post('/documents/import', { items }),
  toggleFavorite: (id) => api.post(`/documents/${id}/favorite`),
  moveToTrash: (id) => api.post(`/documents/${id}/trash`),
  restoreFromTrash: (id) => api.post(`/documents/${id}/restore`),
  emptyTrash: () => api.delete('/documents/trash/empty'),
  moveToFolder: (id, folderName) => api.post(`/documents/${id}/move`, { folderName }),
};
