import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 8788,
		// ローカルでは起動済みのプレビューサーバーを使い回してビルド待ちを省く
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e'
});
