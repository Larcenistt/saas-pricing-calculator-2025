import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import calculationRoutes from './calculation.routes';
import teamRoutes from './team.routes';
import subscriptionRoutes from './subscription.routes';
import analyticsRoutes from './analytics.routes';
import aiRoutes from './ai.routes';
import collaborationRoutes from './collaboration.routes';
import exportRoutes from './export.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'SaaS Pricing Calculator API v1 - Premium Edition',
    version: '2.0.0',
    features: [
      'AI-Powered Pricing Insights',
      'Real-time Collaboration', 
      'Advanced Analytics',
      'Multi-format Export',
      'Enterprise Security'
    ],
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
router.use('/ai', aiRoutes);
router.use('/collaboration', collaborationRoutes);
router.use('/export', exportRoutes);
router.use('/admin', adminRoutes);

export default router;