import { Router } from 'express';
import { lockUser, unlockUser } from '../controllers/admin.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use('/admin', requireAuth, requireAdmin);
router.post('/admin/users/:id/lock', lockUser);
router.post('/admin/users/:id/unlock', unlockUser);

export default router;
