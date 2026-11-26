import { api } from './api.js';

export const imageService = {
  upload: (file) => api.upload('/uploads', file),
  draft: (id) => api.get(`/uploads/${id}`),
  process: (id, options) => api.post(`/uploads/${id}/process`, options),
  save: (id, data) => api.post(`/uploads/${id}/save`, data),
};
