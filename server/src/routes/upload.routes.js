import { Router } from 'express';
import { createUpload, getOriginalUpload } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { handleUploadError, imageUpload } from '../middleware/upload.js';
import { getUploadDraft, getUploadImage, processUpload, saveUpload } from '../controllers/image.controller.js';

const router = Router();
router.post('/uploads', requireAuth, imageUpload.single('file'), createUpload, handleUploadError);
router.get('/uploads/:id/original', requireAuth, getOriginalUpload);
router.post('/uploads/:id/process', requireAuth, processUpload);
router.get('/uploads/:id', requireAuth, getUploadDraft);
router.post('/uploads/:id/save', requireAuth, saveUpload);
router.get('/uploads/:id/processed', requireAuth, (req, res, next) => {
  req.params.asset = 'processed';
  getUploadImage(req, res, next);
});
router.get('/uploads/:id/steps/:index', requireAuth, (req, res, next) => {
  req.params.asset = 'steps';
  getUploadImage(req, res, next);
});

export default router;
