import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';

const router = Router();

router.post('/', SearchController.searchAll);
router.get('/history', SearchController.getHistory);

export default router;
