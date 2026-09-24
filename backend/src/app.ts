import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type Database from 'better-sqlite3';
import { createArticleRepository } from './articles/article.repository.js';
import { registerArticleRoutes } from './articles/article.routes.js';

export interface BuildAppOptions {
  db: Database.Database;
  adminToken: string;
  corsOrigin: string[];
}

export const buildApp = ({ db, adminToken, corsOrigin }: BuildAppOptions) => {
  // Fastify 3 ships CommonJS type definitions, so under NodeNext these imports
  // resolve to a module namespace instead of the callable plugin factory.
  const createFastify = Fastify as unknown as (options?: { logger?: boolean }) => FastifyInstance;
  const registerCors = cors as unknown as Parameters<FastifyInstance['register']>[0];
  const app = createFastify({ logger: false });
  const repository = createArticleRepository(db);

  app.register(registerCors, {
    origin: corsOrigin,
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (!reply.sent) {
      reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  });

  registerArticleRoutes(app, repository, adminToken);
  return app;
};
