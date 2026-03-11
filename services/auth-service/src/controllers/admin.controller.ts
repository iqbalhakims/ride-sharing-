import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { findAll, setActive, findById } from '../models/user.model';
import { AppError } from '@ride-sharing/shared';

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const role = req.query.role as string | undefined;
    const result = await findAll(page, limit, role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { is_active } = z.object({ is_active: z.boolean() }).parse(req.body);
    const existing = await findById(req.params.id);
    if (!existing) throw new AppError('User not found', 404);
    const user = await setActive(req.params.id, is_active);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
