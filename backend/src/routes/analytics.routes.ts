import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder for analytics routes
router.use(authenticate);

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Analytics dashboard data to be implemented' });
});

export default router;