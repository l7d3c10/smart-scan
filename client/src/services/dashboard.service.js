import { api } from './api.js';
import { documentService } from './document.service.js';

export const dashboardService = {
  async load() {
    const [summary, monthly, byType, recentDocuments] = await Promise.all([
      api.get('/stats/summary'),
      api.get('/stats/monthly'),
      api.get('/stats/by-type'),
      documentService.list({ page: 1, limit: 5, sort: 'created_at_desc' }),
    ]);
    return { summary, monthly: monthly.items, byType: byType.items, recentDocuments: recentDocuments.items };
  },
};
