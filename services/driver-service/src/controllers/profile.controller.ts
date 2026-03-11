import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as driverService from '../services/driver.service';
import { findById } from '../models/driver.model';
import { AppError } from '@ride-sharing/shared';

const updateProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  license_no: z.string().optional(),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_plate: z.string().optional(),
});

export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await driverService.getProfile(req.user!.userId);
    res.json({ driver });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    const driver = await driverService.updateProfile(req.user!.userId, data);
    res.json({ driver });
  } catch (err) {
    next(err);
  }
}

export async function getDriverById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await findById(req.params.id);
    if (!driver) throw new AppError('Driver not found', 404);
    res.json({ driver });
  } catch (err) {
    next(err);
  }
}

export async function setAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { available } = z.object({ available: z.boolean() }).parse(req.body);
    const driver = await driverService.setAvailability(req.user!.userId, available);
    res.json({ driver });
  } catch (err) {
    next(err);
  }
}
