import { Router } from 'express';
import {
  getCsrfToken,
  getCurrentUser,
  login,
  logout,
  register,
} from '../controllers/auth.controller.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = Router();

router.get('/auth/csrf', getCsrfToken);
router.post('/auth/register', register);
router.post('/auth/login', loginRateLimit, login);
router.post('/auth/logout', logout);
router.get('/auth/me', getCurrentUser);

export default router;
