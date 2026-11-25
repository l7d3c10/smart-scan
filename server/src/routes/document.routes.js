import { Router } from 'express';
import {
  listDocuments,
  exportDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/document.controller.js';
import { requireAuth, requireDocumentAccess } from '../middleware/auth.js';
import { getDocumentImage } from '../controllers/image.controller.js';

const router = Router();

router.use('/documents', requireAuth);
router.get('/documents', listDocuments);
router.get('/documents/export', exportDocuments);
router.get('/documents/:id', requireDocumentAccess, getDocument);
router.get('/documents/:id/image/:kind', requireDocumentAccess, getDocumentImage);
router.post('/documents', createDocument);
router.put('/documents/:id', requireDocumentAccess, updateDocument);
router.delete('/documents/:id', requireDocumentAccess, deleteDocument);

export default router;
