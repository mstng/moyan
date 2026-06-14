// Supabaseを偽物に差し替える（実DBに接続しないようにする）
jest.mock('../lib/supabase', () => ({
  from: jest.fn(),
  rpc: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const postsRouter = require('./posts');
const supabase = require('../lib/supabase');

// テスト専用のミニExpressアプリ（server.jsは使わない）
const app = express();
app.use(express.json());
app.use('/api/posts', postsRouter);

// 各テストの前にモックの状態をリセットする
beforeEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------------------
// GET /api/posts
// ----------------------------------------------------------------
describe('GET /api/posts', () => {
  test('投稿一覧を返す', async () => {
    const mockPosts = [
      { id: '1', text: 'もやもや', category: '仕事', sympathy_count: 0, created_at: '2024-01-01' },
    ];
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      range:  jest.fn().mockResolvedValue({ data: mockPosts, error: null, count: 1 }),
    });

    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].text).toBe('もやもや');
    expect(res.body.total).toBe(1);
  });

  test('Supabaseエラー時は500を返す', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      range:  jest.fn().mockResolvedValue({ data: null, error: { message: 'DB接続エラー' }, count: 0 }),
    });

    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(500);
  });
});

// ----------------------------------------------------------------
// POST /api/posts
// ----------------------------------------------------------------
describe('POST /api/posts', () => {
  const validPost = { text: 'もやもやしています', category: '仕事' };

  test('投稿を作成して201を返す', async () => {
    const created = { id: '123', ...validPost, sympathy_count: 0, created_at: '2024-01-01' };
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: created, error: null }),
    });

    const res = await request(app).post('/api/posts').send(validPost);
    expect(res.status).toBe(201);
    expect(res.body.text).toBe(validPost.text);
  });

  test('textなしは400を返す', async () => {
    const res = await request(app).post('/api/posts').send({ category: '仕事' });
    expect(res.status).toBe(400);
  });

  test('categoryなしは400を返す', async () => {
    const res = await request(app).post('/api/posts').send({ text: 'もやもや' });
    expect(res.status).toBe(400);
  });

  test('300文字超えは400を返す', async () => {
    const res = await request(app).post('/api/posts').send({
      text: 'あ'.repeat(301),
      category: '仕事',
    });
    expect(res.status).toBe(400);
  });

  test('無効なカテゴリは400を返す', async () => {
    const res = await request(app).post('/api/posts').send({
      text: 'もやもや',
      category: '不正カテゴリ',
    });
    expect(res.status).toBe(400);
  });
});

// ----------------------------------------------------------------
// POST /api/posts/:id/sympathy
// ----------------------------------------------------------------
describe('POST /api/posts/:id/sympathy', () => {
  test('共感を追加して200を返す', async () => {
    supabase.rpc.mockResolvedValue({ error: null });

    const res = await request(app).post('/api/posts/123/sympathy');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Supabaseエラー時は500を返す', async () => {
    supabase.rpc.mockResolvedValue({ error: { message: 'エラー' } });

    const res = await request(app).post('/api/posts/123/sympathy');
    expect(res.status).toBe(500);
  });
});

// ----------------------------------------------------------------
// POST /api/posts/:id/report
// ----------------------------------------------------------------
describe('POST /api/posts/:id/report', () => {
  test('報告を送信して200を返す', async () => {
    supabase.rpc.mockResolvedValue({ error: null });

    const res = await request(app).post('/api/posts/123/report');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ----------------------------------------------------------------
// GET /api/posts/:id/comments
// ----------------------------------------------------------------
describe('GET /api/posts/:id/comments', () => {
  test('コメント一覧を返す', async () => {
    const mockComments = [
      { id: '1', post_id: '123', text: 'コメントです', created_at: '2024-01-01' },
    ];
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockResolvedValue({ data: mockComments, error: null }),
    });

    const res = await request(app).get('/api/posts/123/comments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe('コメントです');
  });

  test('Supabaseエラー時は500を返す', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockResolvedValue({ data: null, error: { message: 'エラー' } }),
    });

    const res = await request(app).get('/api/posts/123/comments');
    expect(res.status).toBe(500);
  });
});

// ----------------------------------------------------------------
// POST /api/posts/:id/comments
// ----------------------------------------------------------------
describe('POST /api/posts/:id/comments', () => {
  test('コメントを作成して201を返す', async () => {
    const created = { id: '1', post_id: '123', text: '共感します', created_at: '2024-01-01' };
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: created, error: null }),
    });

    const res = await request(app).post('/api/posts/123/comments').send({ text: '共感します' });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('共感します');
  });

  test('空テキストは400を返す', async () => {
    const res = await request(app).post('/api/posts/123/comments').send({ text: '' });
    expect(res.status).toBe(400);
  });

  test('200文字超えは400を返す', async () => {
    const res = await request(app).post('/api/posts/123/comments').send({
      text: 'あ'.repeat(201),
    });
    expect(res.status).toBe(400);
  });
});
