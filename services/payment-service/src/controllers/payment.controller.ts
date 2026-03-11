import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db/connection';
import { AppError } from '@ride-sharing/shared';

export async function getPaymentByRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await db('payments').where({ ride_id: req.params.rideId }).first();
    if (!payment) throw new AppError('Payment not found', 404);
    res.json({ payment });
  } catch (err) {
    next(err);
  }
}

export async function addPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = z
      .object({
        type: z.enum(['card', 'wallet']),
        last_four: z.string().length(4).optional(),
        provider_token: z.string(),
        is_default: z.boolean().default(false),
      })
      .parse(req.body);

    if (data.is_default) {
      await db('payment_methods')
        .where({ user_id: req.user!.userId })
        .update({ is_default: false });
    }

    const [method] = await db('payment_methods')
      .insert({ ...data, user_id: req.user!.userId })
      .returning('*');
    res.status(201).json({ method });
  } catch (err) {
    next(err);
  }
}

export async function listPaymentMethods(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const methods = await db('payment_methods')
      .where({ user_id: req.user!.userId })
      .orderBy('is_default', 'desc');
    res.json({ methods });
  } catch (err) {
    next(err);
  }
}

export async function deletePaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await db('payment_methods')
      .where({ id: req.params.id, user_id: req.user!.userId })
      .delete();
    if (!deleted) throw new AppError('Payment method not found', 404);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}
