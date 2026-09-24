import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');

export const articleWriteSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must use lowercase letters, numbers, and hyphens'),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).default(''),
  content: z.string().trim().min(1).max(500_000),
  coverUrl: z.string().trim().max(500).default(''),
  category: z.string().trim().min(1).max(80),
  subcategory: optionalText(80),
  readTime: z.string().trim().max(40).default(''),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().datetime().nullable().optional(),
});

export const publicListQuerySchema = z.object({
  category: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const slugParamsSchema = z.object({ slug: z.string().trim().min(1).max(120) });
export const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });
