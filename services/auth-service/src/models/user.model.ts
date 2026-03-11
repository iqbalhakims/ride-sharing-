import { db } from '../db/connection';
import { User } from '@ride-sharing/shared';

export async function findByEmail(email: string): Promise<(User & { password_hash: string }) | undefined> {
  return db('users').where({ email }).first();
}

export async function findById(id: string): Promise<User | undefined> {
  return db('users').where({ id }).select('id', 'email', 'phone', 'role', 'is_active', 'created_at', 'updated_at').first();
}

export async function findAll(
  page = 1,
  limit = 20,
  role?: string,
): Promise<{ users: User[]; total: number }> {
  const query = db('users').select('id', 'email', 'phone', 'role', 'is_active', 'created_at', 'updated_at');
  if (role) query.where({ role });
  const countQuery = db('users');
  if (role) countQuery.where({ role });
  const [{ count }] = await countQuery.count('id as count');
  const users = await query.orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);
  return { users, total: parseInt(count as string, 10) };
}

export async function setActive(id: string, is_active: boolean): Promise<User> {
  const [user] = await db('users')
    .where({ id })
    .update({ is_active, updated_at: new Date() })
    .returning(['id', 'email', 'phone', 'role', 'is_active', 'created_at', 'updated_at']);
  return user;
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
