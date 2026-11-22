import { Router } from 'express';
import {
  getCsrfToken,
  getCurrentUser,
  changePassword,
  login,
  logout,
  register,
} from '../controllers/auth.controller.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/auth/csrf', getCsrfToken);
router.post('/auth/register', register);
router.post('/auth/login', loginRateLimit, login);
router.post('/auth/logout', logout);
router.get('/auth/me', getCurrentUser);
router.post('/auth/change-password', requireAuth, changePassword);

export default router;
