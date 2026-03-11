import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { updateLocation } from '../services/location.service';

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(359).optional(),
});

export async function updateDriverLocation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { lat, lng, heading } = locationSchema.parse(req.body);
    await updateLocation(req.user!.userId, lat, lng, heading);
    res.json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
}
