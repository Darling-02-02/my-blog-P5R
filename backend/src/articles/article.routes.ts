import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  articleWriteSchema,
  idParamsSchema,
  publicListQuerySchema,
  slugParamsSchema,
} from './article.schema.js';
import type { ArticleRepository } from './article.repository.js';

const sendError = (reply: FastifyReply, statusCode: number, code: string, message: string) =>
  reply.code(statusCode).send({ error: { code, message } });

const parseOrError = <T>(reply: FastifyReply, schema: z.ZodType<T>, value: unknown) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    sendError(reply, 400, 'INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid input');
    return undefined;
  }
  return parsed.data;
};

const registerAdminGuard = (adminToken: string) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    if (!adminToken || request.headers['x-admin-token'] !== adminToken) {
      sendError(reply, 401, 'UNAUTHORIZED', 'Admin token is required');
    }
  };

export const registerArticleRoutes = (
  app: FastifyInstance,
  repository: ArticleRepository,
  adminToken: string,
) => {
  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/api/articles', async (request, reply) => {
    const query = parseOrError(reply, publicListQuerySchema, request.query);
    if (!query) return;
    return repository.listPublished(query);
  });

  app.get('/api/articles/:slug', async (request, reply) => {
    const params = parseOrError(reply, slugParamsSchema, request.params);
    if (!params) return;

    const article = repository.findPublishedBySlug(params.slug);
    if (!article) return sendError(reply, 404, 'ARTICLE_NOT_FOUND', 'Article not found');
    return article;
  });

  const requireAdmin = registerAdminGuard(adminToken);

  app.get('/api/admin/articles', { preHandler: requireAdmin }, async () => ({ items: repository.listAll() }));

  app.post('/api/admin/articles', { preHandler: requireAdmin }, async (request, reply) => {
    const input = parseOrError(reply, articleWriteSchema, request.body);
    if (!input) return;

    try {
      return reply.code(201).send(repository.create(input));
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: articles.slug')) {
        return sendError(reply, 409, 'SLUG_EXISTS', 'Article slug already exists');
      }
      throw error;
    }
  });

  app.put('/api/admin/articles/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const params = parseOrError(reply, idParamsSchema, request.params);
    const input = parseOrError(reply, articleWriteSchema, request.body);
    if (!params || !input) return;

    try {
      const article = repository.update(params.id, input);
      if (!article) return sendError(reply, 404, 'ARTICLE_NOT_FOUND', 'Article not found');
      return article;
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: articles.slug')) {
        return sendError(reply, 409, 'SLUG_EXISTS', 'Article slug already exists');
      }
      throw error;
    }
  });

  app.delete('/api/admin/articles/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const params = parseOrError(reply, idParamsSchema, request.params);
    if (!params) return;

    if (!repository.remove(params.id)) return sendError(reply, 404, 'ARTICLE_NOT_FOUND', 'Article not found');
    return reply.code(204).send();
  });

  app.post('/api/admin/articles/:id/publish', { preHandler: requireAdmin }, async (request, reply) => {
    const params = parseOrError(reply, idParamsSchema, request.params);
    if (!params) return;

    const article = repository.publish(params.id);
    if (!article) return sendError(reply, 404, 'ARTICLE_NOT_FOUND', 'Article not found');
    return article;
  });

  app.post('/api/admin/articles/:id/unpublish', { preHandler: requireAdmin }, async (request, reply) => {
    const params = parseOrError(reply, idParamsSchema, request.params);
    if (!params) return;

    const article = repository.unpublish(params.id);
    if (!article) return sendError(reply, 404, 'ARTICLE_NOT_FOUND', 'Article not found');
    return article;
  });
};
