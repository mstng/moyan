// 環境変数を最初に読み込む（.envファイルの内容をprocess.envに展開する）
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- ミドルウェア設定 ---
// 異なるドメインからのAPIアクセスを許可する（Vercelのフロントから呼べるようにする）
app.use(cors());
// リクエストボディをJSON形式で受け取れるようにする
app.use(express.json());
// publicフォルダ内のHTML/CSS/JSをそのままブラウザに配信する
app.use(express.static(path.join(__dirname, 'public')));

// --- APIルート ---
// 投稿関連のAPIはこのファイルで管理する（後のステップで実装）
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// サーバーが正常に動いているか確認するための簡易エンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Moyanサーバーは動いています' });
});

// --- サーバー起動 ---
app.listen(PORT, () => {
  console.log(`🚀 サーバーが起動しました: http://localhost:${PORT}`);
});

// Vercelがサーバーレス関数として読み込むためにappをエクスポートする
module.exports = app;
