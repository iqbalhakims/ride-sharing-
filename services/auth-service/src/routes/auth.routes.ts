import { Router } from 'express';
import { authMiddleware } from '@ride-sharing/shared';
import * as controller from '../controllers/auth.controller';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', authMiddleware, controller.logout);
router.get('/me', authMiddleware, controller.getMe);

export default router;
