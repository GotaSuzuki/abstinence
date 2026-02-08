# Abstinence

禁欲の継続状況を可視化するダッシュボードアプリ。

## Setup

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を設定

```
cp .env.local.example .env.local
```

`.env.local` に Supabase の値を設定します。

3. Supabase にテーブルを作成

Supabase の SQL Editor で `supabase/schema.sql` を実行してください。
すでに `abstinence_days` を作成済みの場合は、一度削除してから実行してください。

4. 開発サーバーを起動

```bash
npm run dev
```

## Tech

- Next.js (App Router)
- Material UI
- Supabase

## GitHub Pages で公開

1. GitHub に新規リポジトリを作成
2. リポジトリの Settings -> Pages で Source を GitHub Actions に設定
3. リポジトリの Settings -> Secrets and variables -> Actions に以下を追加
- Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `main` ブランチに push すると自動デプロイされます

※ GitHub Actions ではリポジトリ名から自動で `basePath` を設定します。\n  必要なら `NEXT_PUBLIC_BASE_PATH` を Variables に追加して上書きできます。

### 注意

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` は公開キーです
- この構成は認証なしで読み書きできるため、公開URLを知る人は誰でもデータを変更できます

## Scripts

- `npm run dev` 開発サーバー
- `npm run build` 本番ビルド
- `npm run start` 本番サーバー
- `npm run lint` ESLint
