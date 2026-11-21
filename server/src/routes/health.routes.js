import { Router } from 'express';
import { healthController, healthDbController } from '../controllers/health.controller.js';

const router = Router();

router.get('/health', healthController);
router.get('/health/db', healthDbController);

export default router;
