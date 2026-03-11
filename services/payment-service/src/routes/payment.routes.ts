import { Router } from 'express';
import { authMiddleware } from '@ride-sharing/shared';
import * as controller from '../controllers/payment.controller';

const router = Router();

router.use(authMiddleware);

router.get('/:rideId', controller.getPaymentByRide);
router.post('/methods', controller.addPaymentMethod);
router.get('/methods', controller.listPaymentMethods);
router.delete('/methods/:id', controller.deletePaymentMethod);

export default router;
