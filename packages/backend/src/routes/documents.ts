import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { SearchController } from '../controllers/SearchController';
import { upload } from '../validators/documentValidator';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Require JWT for all document routes
router.use(authenticateJWT);

router.post('/upload', requireRole(['ADMIN', 'MANAGER']), upload.single('file'), DocumentController.uploadDocument);
router.get('/', DocumentController.listDocuments);
router.get('/:id', DocumentController.getDocumentDetails);
router.delete('/:id', requireRole(['ADMIN']), DocumentController.deleteDocument);
router.get('/:id/download', DocumentController.downloadDocument);

router.post('/:id/process', requireRole(['ADMIN', 'MANAGER']), DocumentController.processDocument);
router.get('/:id/status', DocumentController.getProcessingStatus);
router.get('/:id/chunks', DocumentController.getDocumentChunks);
router.get('/:id/content', DocumentController.getDocumentContent);
router.post('/:id/search', SearchController.searchDocument);

export default router;
