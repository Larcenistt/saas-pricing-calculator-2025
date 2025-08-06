import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder for team routes
router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Team routes to be implemented' });
});

export default router;