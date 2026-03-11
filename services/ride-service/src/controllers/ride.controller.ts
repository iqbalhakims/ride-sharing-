import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as rideService from '../services/ride.service';
import * as rideModel from '../models/ride.model';
import { AppError } from '@ride-sharing/shared';

const coordinatesSchema = z.object({ lat: z.number(), lng: z.number() });

const requestRideSchema = z.object({
  pickup: coordinatesSchema,
  dropoff: coordinatesSchema,
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
});

export async function requestRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = requestRideSchema.parse(req.body);
    const ride = await rideService.requestRide(
      req.user!.userId,
      data.pickup,
      data.dropoff,
      data.pickupAddress,
      data.dropoffAddress,
    );
    res.status(201).json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function acceptRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ride = await rideService.acceptRide(req.params.id, req.user!.userId);
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function startRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ride = await rideService.startRide(req.params.id, req.user!.userId);
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function endRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { distanceKm, durationSec } = z
      .object({ distanceKm: z.number().positive(), durationSec: z.number().int().positive() })
      .parse(req.body);
    const ride = await rideService.endRide(req.params.id, req.user!.userId, distanceKm, durationSec);
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function cancelRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const ride = await rideService.cancelRide(req.params.id, req.user!.userId, reason);
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function getRide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ride = await rideModel.findById(req.params.id);
    if (!ride) throw new AppError('Ride not found', 404);
    res.json({ ride });
  } catch (err) {
    next(err);
  }
}

export async function getRideHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const role = req.user!.role === 'driver' ? 'driver' : 'rider';
    const result = await rideModel.findByUser(req.user!.userId, role, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
