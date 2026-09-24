import { z } from 'zod';

const configSchema = z.object({
  HOST: z.string().trim().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_PATH: z.string().trim().min(1).default('./data/blog.db'),
  ADMIN_TOKEN: z.string().min(1),
  CORS_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export interface AppConfig {
  host: string;
  port: number;
  databasePath: string;
  adminToken: string;
  corsOrigin: string[];
  nodeEnv: 'development' | 'production' | 'test';
}

export const getConfig = (env: NodeJS.ProcessEnv = process.env): AppConfig => {
  const config = configSchema.parse(env);
  return {
    host: config.HOST,
    port: config.PORT,
    databasePath: config.DATABASE_PATH,
    adminToken: config.ADMIN_TOKEN,
    corsOrigin: config.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
    nodeEnv: config.NODE_ENV,
  };
};
