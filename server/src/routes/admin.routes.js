import { Router } from 'express';
import {
  changeUserRole,
  listUsers,
  lockUser,
  resetUserPassword,
  unlockUser,
} from '../controllers/admin.controller.js';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use('/admin', requireAuth, requireAdmin);
router.get('/admin/users', listUsers);
router.post('/admin/users/:id/role', changeUserRole);
router.post('/admin/users/:id/lock', lockUser);
router.post('/admin/users/:id/unlock', unlockUser);
router.post('/admin/users/:id/reset-password', resetUserPassword);
router.get('/admin/audit-logs', listAuditLogs);

export default router;
