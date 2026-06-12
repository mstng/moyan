const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/posts - 投稿一覧取得
router.get('/', async (req, res) => {
  const { sort = 'new', category, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase.from('posts').select('*', { count: 'exact' });

  // カテゴリが指定された場合だけフィルタする
  if (category) {
    query = query.eq('category', category);
  }

  // 並び順：共感数順 or 新着順
  if (sort === 'sympathy') {
    query = query.order('sympathy_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // ページネーション：取得範囲を指定する
  query = query.range(offset, offset + Number(limit) - 1);

  const { data, error, count } = await query;

  if (error) return res.status(500).json({ error: error.message });

  res.json({ posts: data, total: count, page: Number(page) });
});

// POST /api/posts - 新規投稿
router.post('/', async (req, res) => {
  const { text, category } = req.body;

  // 入力値のバリデーション（システム境界での検証）
  if (!text || !category) {
    return res.status(400).json({ error: 'テキストとカテゴリは必須です' });
  }
  if (text.length > 300) {
    return res.status(400).json({ error: 'テキストは300文字以内で入力してください' });
  }

  const validCategories = ['仕事', '人間関係', '家族', '恋愛', 'お金', 'その他'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: '無効なカテゴリです' });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ text, category })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
});

// POST /api/posts/:id/sympathy - 共感する
router.post('/:id/sympathy', async (req, res) => {
  const { id } = req.params;

  // DB側の関数でアトミックにカウントアップする
  const { error } = await supabase.rpc('increment_sympathy', { post_id: id });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// POST /api/posts/:id/report - 報告する
router.post('/:id/report', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.rpc('increment_report', { post_id: id });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

module.exports = router;
