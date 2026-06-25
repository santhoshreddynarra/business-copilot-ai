import { Router } from 'express';

const router = Router();

// TODO: Map to controller methods
router.post('/register', (req, res) => res.json({ message: 'Register placeholder' }));
router.post('/login', (req, res) => res.json({ message: 'Login placeholder' }));
router.post('/logout', (req, res) => res.json({ message: 'Logout placeholder' }));
router.get('/me', (req, res) => res.json({ data: { id: 'mock-user-id', name: 'Sarah Executive', role: 'Workspace Owner' } }));

export default router;
