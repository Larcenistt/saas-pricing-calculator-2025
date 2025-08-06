import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/account', userController.deleteAccount);
router.post('/change-password', userController.changePassword);
router.get('/api-keys', userController.getApiKeys);
router.post('/api-keys', userController.createApiKey);
router.delete('/api-keys/:id', userController.deleteApiKey);

export default router;