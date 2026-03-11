import { db } from '../db/connection';
import { Driver } from '@ride-sharing/shared';

export async function findById(id: string): Promise<Driver | undefined> {
  return db('drivers').where({ id }).first();
}

export async function create(data: { id: string }): Promise<Driver> {
  const [driver] = await db('drivers')
    .insert({ id: data.id, first_name: '', last_name: '', license_no: `PENDING-${data.id}`, vehicle_plate: `PENDING-${data.id}` })
    .returning('*');
  return driver;
}

export async function update(
  id: string,
  data: Partial<Omit<Driver, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Driver> {
  const [driver] = await db('drivers')
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning('*');
  return driver;
}

export async function findAll(
  page = 1,
  limit = 20,
): Promise<{ drivers: Driver[]; total: number }> {
  const [{ count }] = await db('drivers').count('id as count');
  const drivers = await db('drivers')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  return { drivers, total: parseInt(count as string, 10) };
}

export async function setVerified(id: string, is_verified: boolean): Promise<Driver> {
  const [driver] = await db('drivers')
    .where({ id })
    .update({ is_verified, updated_at: new Date() })
    .returning('*');
  return driver;
}

export async function updateAvailability(id: string, is_available: boolean): Promise<Driver> {
  const [driver] = await db('drivers')
    .where({ id })
    .update({ is_available, updated_at: new Date() })
    .returning('*');
  return driver;
}
