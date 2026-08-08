import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	// CI では一時的な失敗を切り分けられるようリトライし、再試行時のみ trace を残す
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
	use: {
		trace: 'on-first-retry'
	},
	webServer: {
		// preview 自体が build を含むため、ここで build を重ねない
		command: 'npm run preview',
		port: 8788,
		// ローカルでは起動済みのプレビューサーバーを使い回してビルド待ちを省く
		reuseExistingServer: !process.env.CI
	}
});
