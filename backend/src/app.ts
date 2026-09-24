import Fastify from 'fastify';
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
  const app = Fastify({ logger: false });
  const repository = createArticleRepository(db);

  app.register(cors, {
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
