import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { findAll, findById, setVerified } from '../models/driver.model';
import { AppError } from '@ride-sharing/shared';

export async function listAllDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const result = await findAll(page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { is_verified } = z.object({ is_verified: z.boolean() }).parse(req.body);
    const existing = await findById(req.params.id);
    if (!existing) throw new AppError('Driver not found', 404);
    const driver = await setVerified(req.params.id, is_verified);
    res.json({ driver });
  } catch (err) {
    next(err);
  }
}
