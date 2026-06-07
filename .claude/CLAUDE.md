# 基本方針
- 変更を加える前に、必ず作業計画を提示して確認を取ること
- 一度に大量の変更をせず、小さく段階的に進めること
- 不明点があれば作業を止めて質問すること

# やってはいけないこと
- 指示されていないファイルを勝手に変更しない
- `.env` ファイルを読み取ったり変更したりしない
- テストを勝手にスキップしない

# コンテキスト管理
- 作業完了後は `/clear` を促すこと
- 長いセッションでは `/compact` を提案すること

# コマンド
- `npm run dev` — 開発サーバー起動
- `npm run lint` — Prettier + ESLint チェック
- `npm run check` — 型チェック (svelte-check)
- `npm run test:unit` — Vitest 単体テスト
- `npm run test:e2e` — Playwright E2E テスト
- `npm run build` — ビルド
- `npm run deploy` — Cloudflare Pages へデプロイ