import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateJWT, AuthController.getMe);
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleAuthCallback);

export default router;
