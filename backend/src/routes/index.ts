import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import calculationRoutes from './calculation.routes';
import teamRoutes from './team.routes';
import subscriptionRoutes from './subscription.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SaaS Pricing Calculator API v1',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/calculations', calculationRoutes);
router.use('/teams', teamRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/analytics', analyticsRoutes);

export default router;