import bcrypt from 'bcryptjs';
import { createClient } from 'redis';
import { signToken, verifyToken, AppError } from '@ride-sharing/shared';
import { config } from '../config/env';
import { findByEmail, findById, createUser } from '../models/user.model';

let redisClient: ReturnType<typeof createClient>;

export async function initRedis(): Promise<void> {
  redisClient = createClient({ url: config.redisUrl });
  await redisClient.connect();
}

export async function register(
  email: string,
  password: string,
  role: string,
  phone?: string,
) {
  const existing = await findByEmail(email);
  if (existing) throw new AppError('Email already in use', 409);

  const password_hash = await bcrypt.hash(password, 12);
  return createUser({ email, password_hash, role, phone });
}

export async function login(email: string, password: string) {
  const user = await findByEmail(email);
  if (!user) throw new AppError('Invalid credentials', 401);
  if (!user.is_active) throw new AppError('Account is deactivated', 403);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const payload = { userId: user.id, role: user.role as 'rider' | 'driver' | 'admin' };
  const accessToken = signToken(payload, config.jwtSecret, config.jwtExpiresIn);
  const refreshToken = signToken(payload, config.jwtRefreshSecret, config.jwtRefreshExpiresIn);

  // Store refresh token hash in Redis (7 days TTL)
  const hash = await bcrypt.hash(refreshToken, 6);
  await redisClient.set(`refresh:${user.id}`, hash, { EX: 7 * 24 * 60 * 60 });

  return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
}

export async function refresh(refreshToken: string) {
  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(refreshToken, config.jwtRefreshSecret);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const storedHash = await redisClient.get(`refresh:${payload.userId}`);
  if (!storedHash) throw new AppError('Session expired', 401);

  const valid = await bcrypt.compare(refreshToken, storedHash);
  if (!valid) throw new AppError('Invalid refresh token', 401);

  const user = await findById(payload.userId);
  if (!user || !user.is_active) throw new AppError('User not found or inactive', 401);

  const accessToken = signToken(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    config.jwtExpiresIn,
  );
  return { accessToken };
}

export async function logout(userId: string): Promise<void> {
  await redisClient.del(`refresh:${userId}`);
}
