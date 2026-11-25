import { Router } from 'express';
import {
  listDocuments,
  getNextCode,
  getFolders,
  exportDocuments,
  getDocument,
  getDocumentHistory,
  createDocument,
  updateDocument,
  deleteDocument,
  toggleFavorite,
  moveToTrash,
  restoreFromTrash,
  emptyTrash,
  moveDocument,
  bulkDeleteDocuments,
  copyDocument,
  bulkCopyDocuments,
  importDocuments,
} from '../controllers/document.controller.js';
import { requireAuth, requireDocumentAccess } from '../middleware/auth.js';
import { getDocumentImage } from '../controllers/image.controller.js';

const router = Router();

router.use('/documents', requireAuth);

// Static document paths must be registered before /documents/:id
router.get('/documents', listDocuments);
router.get('/documents/folders', getFolders);
router.get('/documents/next-code', getNextCode);
router.get('/documents/export', exportDocuments);
router.post('/documents', createDocument);
router.post('/documents/import', importDocuments);
router.post('/documents/bulk-delete', bulkDeleteDocuments);
router.post('/documents/bulk-copy', bulkCopyDocuments);
router.delete('/documents/trash/empty', emptyTrash);

// Parametrized document paths
router.get('/documents/:id', requireDocumentAccess, getDocument);
router.get('/documents/:id/history', requireDocumentAccess, getDocumentHistory);
router.get('/documents/:id/image/:kind', requireDocumentAccess, getDocumentImage);
router.put('/documents/:id', requireDocumentAccess, updateDocument);
router.delete('/documents/:id', requireDocumentAccess, deleteDocument);
router.post('/documents/:id/copy', requireDocumentAccess, copyDocument);
router.post('/documents/:id/favorite', requireDocumentAccess, toggleFavorite);
router.post('/documents/:id/trash', requireDocumentAccess, moveToTrash);
router.post('/documents/:id/restore', requireDocumentAccess, restoreFromTrash);
router.post('/documents/:id/move', requireDocumentAccess, moveDocument);

export default router;
