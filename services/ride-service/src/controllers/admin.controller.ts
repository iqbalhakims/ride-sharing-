import { Request, Response, NextFunction } from 'express';
import * as rideModel from '../models/ride.model';

export async function listAllRides(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const status = req.query.status as string | undefined;
    const result = await rideModel.findAll(page, limit, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
