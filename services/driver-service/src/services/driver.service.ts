import { AppError } from '@ride-sharing/shared';
import * as driverModel from '../models/driver.model';
import { geoClient } from '../redis/geo.client';

export async function getProfile(driverId: string) {
  const driver = await driverModel.findById(driverId);
  if (!driver) throw new AppError('Driver not found', 404);
  return driver;
}

export async function updateProfile(driverId: string, data: Record<string, unknown>) {
  const driver = await driverModel.findById(driverId);
  if (!driver) throw new AppError('Driver not found', 404);
  return driverModel.update(driverId, data as Parameters<typeof driverModel.update>[1]);
}

export async function setAvailability(driverId: string, available: boolean) {
  const driver = await driverModel.updateAvailability(driverId, available);
  await geoClient.setDriverAvailable(driverId, available);
  if (!available) await geoClient.removeDriver(driverId);
  return driver;
}
