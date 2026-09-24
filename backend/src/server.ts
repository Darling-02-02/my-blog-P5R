import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { buildApp } from './app.js';
import { getConfig } from './config.js';
import { createDatabase, migrateDatabase } from './db.js';

const config = getConfig();
const databasePath = path.resolve(config.databasePath);
mkdirSync(path.dirname(databasePath), { recursive: true });

const db = createDatabase(databasePath);
migrateDatabase(db);
const app = buildApp({
  db,
  adminToken: config.adminToken,
  corsOrigin: config.corsOrigin,
});

const close = async () => {
  await app.close();
  db.close();
};

process.once('SIGINT', close);
process.once('SIGTERM', close);

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  await close();
  process.exitCode = 1;
}
