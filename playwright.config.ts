import { defineConfig } from '@playwright/test';

// 8788 が別のチェックアウトや残留プロセスに掴まれているときは E2E_PORT で退避する
const port = Number(process.env.E2E_PORT ?? 8788);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: 'e2e',
	// CI では一時的な失敗を切り分けられるようリトライし、再試行時のみ trace を残す
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
	use: {
		baseURL,
		trace: 'on-first-retry'
	},
	webServer: {
		// preview 自体が build を含むため、ここで build を重ねない
		command: `npm run preview -- --port ${port}`,
		// localhost は IPv4/IPv6 の解決差で繋がらないことがあるため IP を固定する
		url: baseURL,
		// build を含むぶん、既定の 60 秒では足りない環境がある
		timeout: 120_000,
		// 起動に失敗した理由（ポート衝突など）を握り潰さず表に出す
		stdout: 'pipe',
		stderr: 'pipe',
		// ローカルでは起動済みのプレビューサーバーを使い回してビルド待ちを省く
		reuseExistingServer: !process.env.CI
	}
});
