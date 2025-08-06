import { Router } from 'express';
import { calculationController } from '../controllers/calculation.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/shared/:shareToken', optionalAuth, calculationController.getSharedCalculation);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/', calculationController.getCalculations);
router.post('/', calculationController.createCalculation);
router.get('/:id', calculationController.getCalculation);
router.put('/:id', calculationController.updateCalculation);
router.delete('/:id', calculationController.deleteCalculation);
router.post('/:id/share', calculationController.shareCalculation);
router.post('/:id/duplicate', calculationController.duplicateCalculation);
router.get('/:id/versions', calculationController.getCalculationVersions);
router.post('/:id/export', calculationController.exportCalculation);

export default router;