import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const createDatabase = (filename: string) => {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  return db;
};

export const migrateDatabase = (db: Database.Database) => {
  const migration = readFileSync(path.resolve(process.cwd(), 'migrations/001_init.sql'), 'utf8');
  db.exec(migration);
};
