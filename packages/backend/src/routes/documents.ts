import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { upload } from '../validators/documentValidator';

const router = Router();

router.post('/upload', upload.single('file'), DocumentController.uploadDocument);
router.get('/', DocumentController.listDocuments);
router.get('/:id', DocumentController.getDocumentDetails);
router.delete('/:id', DocumentController.deleteDocument);
router.get('/:id/download', DocumentController.downloadDocument);

export default router;
