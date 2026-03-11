import { Router } from 'express';
import { authMiddleware, requireRole } from '@ride-sharing/shared';
import * as profileController from '../controllers/profile.controller';
import * as locationController from '../controllers/location.controller';

const router = Router();

router.get('/me', authMiddleware, requireRole('driver'), profileController.getMyProfile);
router.patch('/me', authMiddleware, requireRole('driver'), profileController.updateMyProfile);
router.patch('/location', authMiddleware, requireRole('driver'), locationController.updateDriverLocation);
router.patch('/availability', authMiddleware, requireRole('driver'), profileController.setAvailability);
router.get('/:id', authMiddleware, profileController.getDriverById);

export default router;
