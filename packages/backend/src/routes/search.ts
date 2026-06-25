import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireRole(['ADMIN', 'MANAGER', 'ANALYST']), SearchController.searchAll);
router.get('/history', SearchController.getHistory);
router.get('/metrics', SearchController.getMetrics);

export default router;
