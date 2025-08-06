import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder for subscription routes
router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Subscription routes to be implemented' });
});

export default router;