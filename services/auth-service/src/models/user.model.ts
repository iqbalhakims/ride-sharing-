import { db } from '../db/connection';
import { User } from '@ride-sharing/shared';

export async function findByEmail(email: string): Promise<(User & { password_hash: string }) | undefined> {
  return db('users').where({ email }).first();
}

export async function findById(id: string): Promise<User | undefined> {
  return db('users').where({ id }).select('id', 'email', 'phone', 'role', 'is_active', 'created_at', 'updated_at').first();
}

export async function createUser(data: {
  email: string;
  password_hash: string;
  role: string;
  phone?: string;
}): Promise<User> {
  const [user] = await db('users')
    .insert(data)
    .returning(['id', 'email', 'phone', 'role', 'is_active', 'created_at', 'updated_at']);
  return user;
}
