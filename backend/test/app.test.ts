import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';
import { createDatabase, migrateDatabase } from '../src/db.js';

const createTestApp = () => {
  const db = createDatabase(':memory:');
  migrateDatabase(db);
  const app = buildApp({ db, adminToken: 'test-token', corsOrigin: ['http://localhost:5173'] });
  return { app, db };
};

test('health endpoint returns ok', async () => {
  const { app, db } = createTestApp();

  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
  await app.close();
  db.close();
});

test('public article list excludes drafts', async () => {
  const { app, db } = createTestApp();
  db.prepare(`INSERT INTO articles (slug, title, excerpt, content, category, read_time, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run('draft-post', 'Draft', '', '# draft', '随笔', '', 'draft', '2026-09-24T00:00:00.000Z', '2026-09-24T00:00:00.000Z');

  const response = await app.inject({ method: 'GET', url: '/api/articles' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().items, []);
  await app.close();
  db.close();
});

test('admin can create, edit, publish, read, unpublish, and delete an article', async () => {
  const { app, db } = createTestApp();
  const headers = { 'x-admin-token': 'test-token' };
  const draft = {
    slug: 'first-post',
    title: 'First post',
    excerpt: 'A short excerpt',
    content: '# Draft body',
    coverUrl: '',
    category: '随笔',
    subcategory: '',
    readTime: '5 分钟',
    tags: ['React', 'SQLite'],
    status: 'draft',
  };

  const createResponse = await app.inject({ method: 'POST', url: '/api/admin/articles', headers, payload: draft });
  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json();
  assert.equal(created.status, 'draft');
  assert.deepEqual(created.tags, ['React', 'SQLite']);

  const publicDraftList = await app.inject({ method: 'GET', url: '/api/articles' });
  assert.deepEqual(publicDraftList.json().items, []);

  const updateResponse = await app.inject({
    method: 'PUT',
    url: `/api/admin/articles/${created.id}`,
    headers,
    payload: { ...draft, title: 'Updated post', content: '# Published body', status: 'published' },
  });
  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.json().title, 'Updated post');
  assert.equal(updateResponse.json().status, 'published');

  const publicList = await app.inject({ method: 'GET', url: '/api/articles' });
  assert.equal(publicList.statusCode, 200);
  assert.equal(publicList.json().items[0].slug, 'first-post');
  assert.equal('content' in publicList.json().items[0], false);

  const detail = await app.inject({ method: 'GET', url: '/api/articles/first-post' });
  assert.equal(detail.statusCode, 200);
  assert.equal(detail.json().content, '# Published body');

  const unpublish = await app.inject({ method: 'POST', url: `/api/admin/articles/${created.id}/unpublish`, headers });
  assert.equal(unpublish.statusCode, 200);
  assert.equal(unpublish.json().status, 'draft');

  const hiddenDetail = await app.inject({ method: 'GET', url: '/api/articles/first-post' });
  assert.equal(hiddenDetail.statusCode, 404);

  const remove = await app.inject({ method: 'DELETE', url: `/api/admin/articles/${created.id}`, headers });
  assert.equal(remove.statusCode, 204);

  await app.close();
  db.close();
});

test('admin routes reject missing token and duplicate slugs', async () => {
  const { app, db } = createTestApp();
  const payload = {
    slug: 'duplicate-post',
    title: 'Duplicate',
    excerpt: '',
    content: '# body',
    coverUrl: '',
    category: '随笔',
    subcategory: '',
    readTime: '',
    tags: [],
    status: 'draft',
  };

  const unauthorized = await app.inject({ method: 'GET', url: '/api/admin/articles' });
  assert.equal(unauthorized.statusCode, 401);

  const first = await app.inject({ method: 'POST', url: '/api/admin/articles', headers: { 'x-admin-token': 'test-token' }, payload });
  assert.equal(first.statusCode, 201);

  const duplicate = await app.inject({ method: 'POST', url: '/api/admin/articles', headers: { 'x-admin-token': 'test-token' }, payload });
  assert.equal(duplicate.statusCode, 409);
  assert.equal(duplicate.json().error.code, 'SLUG_EXISTS');

  await app.close();
  db.close();
});
