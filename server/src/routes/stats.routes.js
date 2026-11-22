import { Router } from 'express';
import { getMonthlyStats, getSummary, getTypeStats } from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use('/stats', requireAuth);
router.get('/stats/summary', getSummary);
router.get('/stats/monthly', getMonthlyStats);
router.get('/stats/by-type', getTypeStats);

export default router;
