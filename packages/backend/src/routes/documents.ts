import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { SearchController } from '../controllers/SearchController';
import { upload } from '../validators/documentValidator';

const router = Router();

router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.get('/', DocumentController.listDocuments);
router.get('/:id', DocumentController.getDocumentDetails);
router.delete('/:id', DocumentController.deleteDocument);
router.get('/:id/download', DocumentController.downloadDocument);

router.post('/:id/process', DocumentController.processDocument);
router.get('/:id/status', DocumentController.getProcessingStatus);
router.get('/:id/chunks', DocumentController.getDocumentChunks);
router.get('/:id/content', DocumentController.getDocumentContent);
router.post('/:id/search', SearchController.searchDocument);

export default router;
