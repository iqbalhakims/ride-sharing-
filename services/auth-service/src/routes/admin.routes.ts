import { Router } from 'express';
import { authMiddleware, requireRole } from '@ride-sharing/shared';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.get('/users', authMiddleware, requireRole('admin'), adminController.listUsers);
router.patch('/users/:id/status', authMiddleware, requireRole('admin'), adminController.toggleUserStatus);

export default router;
