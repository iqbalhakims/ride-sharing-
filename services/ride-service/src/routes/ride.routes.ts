import { Router } from 'express';
import { authMiddleware, requireRole } from '@ride-sharing/shared';
import * as controller from '../controllers/ride.controller';

const router = Router();

router.post('/', authMiddleware, requireRole('rider'), controller.requestRide);
router.get('/history', authMiddleware, controller.getRideHistory);
router.get('/:id', authMiddleware, controller.getRide);
router.patch('/:id/accept', authMiddleware, requireRole('driver'), controller.acceptRide);
router.patch('/:id/start', authMiddleware, requireRole('driver'), controller.startRide);
router.patch('/:id/end', authMiddleware, requireRole('driver'), controller.endRide);
router.patch('/:id/cancel', authMiddleware, controller.cancelRide);

export default router;
