# Moyan（モヤン）設計書

> 匿名でもやもやを投稿して、共感してもらえる場所

---

## 1. サービス概要

| 項目 | 内容 |
|------|------|
| サービス名 | Moyan（モヤン） |
| コンセプト | 匿名でもやもやを吐き出し、共感で救われる |
| ターゲット | 誰でも（認証不要・匿名） |
| 公開方法 | Vercel（無料） |

---

## 2. 機能要件

### MVP（最初に作るもの）

| 機能 | 詳細 |
|------|------|
| 投稿 | テキスト（最大300文字）＋カテゴリ選択 |
| 一覧表示 | 新着順・共感数順で切り替え |
| 共感ボタン | 1投稿につき1回押せる（ローカルストレージで管理） |
| 報告ボタン | 不適切な投稿を報告できる |

### Phase 2（後から追加）

| 機能 | 詳細 |
|------|------|
| タグ | 投稿に複数タグを付けられる |
| 返信・コメント | 投稿に対してコメントできる |

---

## 3. カテゴリ一覧

- 仕事
- 人間関係
- 家族
- 恋愛
- お金
- その他

---

## 4. 画面設計

### トップページ（/）
```
┌─────────────────────────────┐
│  Moyan 〜もやもやを吐き出そう〜  │
├─────────────────────────────┤
│ [投稿する] ボタン              │
├─────────────────────────────┤
│ 並び順: [新着順] [共感順]       │
│ カテゴリ: [全て][仕事][人間関係]… │
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │ カテゴリ: 仕事           │   │
│ │ 上司に理不尽に怒られた…   │   │
│ │ 😔 共感 12  🚩 報告      │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ ...                    │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

### 投稿モーダル
```
┌──────────────────────────┐
│ もやもやを投稿する          │
│                           │
│ カテゴリ: [▼ 選択してください] │
│                           │
│ ┌────────────────────┐   │
│ │ もやもやを書いてね…  │   │
│ │                    │   │
│ └────────────────────┘   │
│ 残り文字数: 300            │
│                           │
│ [キャンセル]  [投稿する]    │
└──────────────────────────┘
```

---

## 5. API設計

### エンドポイント一覧

| メソッド | パス | 説明 |
|--------|------|------|
| GET | /api/posts | 投稿一覧取得 |
| POST | /api/posts | 新規投稿 |
| POST | /api/posts/:id/sympathy | 共感する |
| POST | /api/posts/:id/report | 報告する |
| GET | /api/posts/:id/comments | コメント一覧（Phase 2） |
| POST | /api/posts/:id/comments | コメント投稿（Phase 2） |

### GET /api/posts

クエリパラメータ：
- `sort`: `new`（新着順） or `sympathy`（共感順）、デフォルト: `new`
- `category`: カテゴリ名でフィルタ（省略時は全件）
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページの件数（デフォルト: 20）

レスポンス例：
```json
{
  "posts": [
    {
      "id": "uuid-xxxx",
      "text": "上司に理不尽に怒られた…",
      "category": "仕事",
      "sympathy_count": 12,
      "report_count": 0,
      "created_at": "2026-06-13T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1
}
```

### POST /api/posts

リクエストボディ：
```json
{
  "text": "上司に理不尽に怒られた…",
  "category": "仕事"
}
```

---

## 6. データベース設計（PostgreSQL / Supabase）

### postsテーブル

| カラム | 型 | 必須 | 説明 |
|-------|----|----|------|
| `id` | UUID | ✅ | 主キー（自動生成） |
| `text` | TEXT | ✅ | 投稿本文（最大300文字） |
| `category` | TEXT | ✅ | カテゴリ（CHECK制約で値を限定） |
| `sympathy_count` | INTEGER | ✅ | 共感数（デフォルト: 0） |
| `report_count` | INTEGER | ✅ | 報告数（デフォルト: 0） |
| `created_at` | TIMESTAMPTZ | ✅ | 投稿日時（自動） |
| `updated_at` | TIMESTAMPTZ | ✅ | 更新日時（自動） |

作成SQL：
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL CHECK (char_length(text) <= 300),
  category TEXT NOT NULL CHECK (
    category IN ('仕事', '人間関係', '家族', '恋愛', 'お金', 'その他')
  ),
  sympathy_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### commentsテーブル（Phase 2）

| カラム | 型 | 必須 | 説明 |
|-------|----|----|------|
| `id` | UUID | ✅ | 主キー（自動生成） |
| `post_id` | UUID | ✅ | postsテーブルへの外部キー |
| `text` | TEXT | ✅ | コメント本文（最大200文字） |
| `created_at` | TIMESTAMPTZ | ✅ | 投稿日時（自動） |

作成SQL（Phase 2）：
```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| Runtime | Node.js v24 | 環境構築済み |
| Framework | Express v4 | 定番・情報豊富 |
| DB | Supabase（PostgreSQL） | アカウント既存・無料枠あり・トレンド |
| DB Client | @supabase/supabase-js | Supabase公式クライアント |
| Frontend | Vanilla HTML / CSS / JS | フレームワーク不要でシンプルに |
| Deploy | Vercel（無料） | アカウント既存・デプロイ最速 |

---

## 8. デプロイ構成

```
[ローカル開発]
    ↓ git push
[GitHub リポジトリ]
    ↓ 自動デプロイ（Vercel連携）
[Vercel（サーバーレス）]
    ↓ 接続
[Supabase（PostgreSQL）]
```

追加ファイル：`vercel.json`（Expressをサーバーレスとして動かすための設定）

---

## 9. 開発ステップ

1. ✅ 設計書作成
2. ✅ プロジェクトフォルダ・package.json 作成
3. ✅ Expressサーバー（server.js）作成
4. Supabase 設定・テーブル作成・接続
5. 投稿・共感・報告 API 作成
6. フロントエンド（HTML/CSS/JS）作成
7. ローカル動作確認
8. GitHub にプッシュ → Vercel でデプロイ

---

*作成日: 2026-06-13*
*更新日: 2026-06-13（MongoDBからSupabaseに変更）*
