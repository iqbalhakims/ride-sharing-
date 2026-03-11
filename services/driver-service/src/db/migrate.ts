import fs from 'fs';
import path from 'path';
import { db } from './connection';
import { logger } from '@ride-sharing/shared';

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  await db.raw(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const already = await db('_migrations').where({ name: file }).first();
    if (already) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await db.raw(sql);
    await db('_migrations').insert({ name: file });
    logger.info(`Migration applied: ${file}`);
  }
}
