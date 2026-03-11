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

export async function updateAvailability(id: string, is_available: boolean): Promise<Driver> {
  const [driver] = await db('drivers')
    .where({ id })
    .update({ is_available, updated_at: new Date() })
    .returning('*');
  return driver;
}
