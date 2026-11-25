import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createPool } from './db/pool.js';
import { scheduleUploadCleanup } from './services/uploadCleanup.service.js';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(projectRoot, '.env') });

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const app = createApp(pool, config);
scheduleUploadCleanup(pool, config.storageRoot);
const server = app.listen(config.port, () => {
  console.log(`SmartScan API đang chạy tại http://localhost:${config.port}/api`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
