import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	// ヘッダーとセットアップ画面の 2 つの h1 があるため先頭に絞る
	await expect(page.locator('h1').first()).toBeVisible();
});
