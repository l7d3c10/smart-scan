import { api } from './api.js';

export const adminService = {
  users: (params = {}) => api.get(`/admin/users?${new URLSearchParams(params)}`),
  setRole: (id, role) => api.post(`/admin/users/${id}/role`, { role }),
  lockUser: (id) => api.post(`/admin/users/${id}/lock`, {}),
  unlockUser: (id) => api.post(`/admin/users/${id}/unlock`, {}),
  resetPassword: (id, password) => api.post(`/admin/users/${id}/reset-password`, { password }),
  auditLogs: (params = {}) => api.get(`/admin/audit-logs?${new URLSearchParams(params)}`),
};
