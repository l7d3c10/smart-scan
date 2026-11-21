import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

export function createPool(connectionString) {
  return new Pool({ connectionString });
}

// Singleton pool – loaded once when the module is first imported.
// server.js creates the pool explicitly and passes it to createApp();
// this singleton is a convenience for direct imports in repositories.
const _projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
dotenv.config({ path: path.join(_projectRoot, '.env') });

export const pool = createPool(process.env.DATABASE_URL);
