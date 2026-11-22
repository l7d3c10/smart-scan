import { Router } from 'express';
import { createUpload, getOriginalUpload } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { handleUploadError, imageUpload } from '../middleware/upload.js';

const router = Router();
router.post('/uploads', requireAuth, imageUpload.single('file'), createUpload, handleUploadError);
router.get('/uploads/:id/original', requireAuth, getOriginalUpload);

export default router;
