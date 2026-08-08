import { expect, test } from '@playwright/test';
import { setPlayerName, stallSignalingServer, waitForHydration } from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await waitForHydration(page);
});

test.describe('セットアップ画面', () => {
	test('アプリのヘッダーとフッターを表示する', async ({ page }) => {
		await expect(page.getByRole('banner')).toContainText('Peer Porker');
		await expect(page.getByRole('contentinfo')).toContainText('Peer Porker');
	});

	test('タイトルとプレイヤーアイコンを表示する', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Planning Poker' })).toBeVisible();
		await expect(page.locator('.player-icon')).toBeVisible();
		// マウント時にヒーローアイコンが割り当てられる
		await expect(page.locator('.icon-container svg')).toBeVisible();
	});

	test('ゲーム画面の要素はまだ表示しない', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Your Estimate' })).toBeHidden();
		await expect(page.getByRole('button', { name: /Reveal Cards/ })).toBeHidden();
	});

	test('アイコンをクリックするとアクションメニューが開く', async ({ page }) => {
		await page.locator('.player-icon').click();

		await expect(page.getByRole('button', { name: /名前設定/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /ゲーム開始/ })).toBeVisible();
	});

	test('メニュー外をクリックするとメニューが閉じる', async ({ page }) => {
		await page.locator('.player-icon').click();

		await page.locator('.overlay').click();

		await expect(page.getByRole('button', { name: /名前設定/ })).toBeHidden();
	});

	test('名前が未設定のうちはゲーム開始を選べない', async ({ page }) => {
		await page.locator('.player-icon').click();

		await expect(page.getByRole('button', { name: /ゲーム開始/ })).toBeDisabled();
	});
});

test.describe('名前の設定', () => {
	test('設定した名前がアイコンの下に表示される', async ({ page }) => {
		await setPlayerName(page, 'Alice');

		await expect(page.locator('.name-display')).toHaveText('Alice');
	});

	test('名前を設定するとゲーム開始を選べるようになる', async ({ page }) => {
		await setPlayerName(page, 'Alice');

		await page.locator('.player-icon').click();

		await expect(page.getByRole('button', { name: /ゲーム開始/ })).toBeEnabled();
	});

	test('名前が空のままでは保存できない', async ({ page }) => {
		await page.locator('.player-icon').click();
		await page.getByRole('button', { name: /名前設定/ }).click();

		await expect(page.getByRole('button', { name: '保存' })).toBeDisabled();
	});

	test('キャンセルすると名前は設定されない', async ({ page }) => {
		await page.locator('.player-icon').click();
		await page.getByRole('button', { name: /名前設定/ }).click();
		await page.getByLabel('名前').fill('Alice');

		await page.getByRole('button', { name: 'キャンセル' }).click();

		await expect(page.getByRole('dialog')).toBeHidden();
		await expect(page.locator('.name-display')).toBeHidden();
	});

	test('Escape キーでダイアログを閉じられる', async ({ page }) => {
		await page.locator('.player-icon').click();
		await page.getByRole('button', { name: /名前設定/ }).click();

		await page.getByLabel('名前').press('Escape');

		await expect(page.getByRole('dialog')).toBeHidden();
	});

	test('Enter キーで名前を保存できる', async ({ page }) => {
		await page.locator('.player-icon').click();
		await page.getByRole('button', { name: /名前設定/ }).click();
		await page.getByLabel('名前').fill('Bob');

		await page.getByLabel('名前').press('Enter');

		await expect(page.locator('.name-display')).toHaveText('Bob');
	});

	test('設定済みの名前がダイアログの初期値になる', async ({ page }) => {
		await setPlayerName(page, 'Alice');

		await page.locator('.player-icon').click();
		await page.getByRole('button', { name: /名前設定/ }).click();

		await expect(page.getByLabel('名前')).toHaveValue('Alice');
	});
});

test.describe('接続ダイアログ', () => {
	test.beforeEach(async ({ page }) => {
		await setPlayerName(page, 'Alice');
		await page.locator('.player-icon').click();
		await page.getByRole('button', { name: /ゲーム開始/ }).click();
	});

	test('接続の説明と操作ボタンを表示する', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'サーバーに接続' })).toBeVisible();
		await expect(page.getByRole('button', { name: '接続開始' })).toBeEnabled();
		await expect(page.getByRole('button', { name: 'キャンセル' })).toBeEnabled();
	});

	test('キャンセルでセットアップ画面に戻る', async ({ page }) => {
		await page.getByRole('button', { name: 'キャンセル' }).click();

		await expect(page.getByRole('dialog')).toBeHidden();
		await expect(page.getByRole('heading', { name: 'Planning Poker' })).toBeVisible();
	});
});

test.describe('サーバーが応答しないとき', () => {
	test.beforeEach(async ({ page }) => {
		await stallSignalingServer(page);
		await page.goto('/');
		await setPlayerName(page, 'Alice');
		await page.locator('.player-icon').click();
		await page.getByRole('button', { name: /ゲーム開始/ }).click();
		await page.getByRole('button', { name: '接続開始' }).click();
	});

	test('接続中の表示に切り替わりボタンが無効になる', async ({ page }) => {
		await expect(page.getByText('サーバーに接続しています')).toBeVisible();
		await expect(page.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
		await expect(page.locator('.progress-bar')).toBeVisible();
	});

	test('5 秒待ってもつながらなければサーバー起動中の案内を出す', async ({ page }) => {
		await expect(page.getByText('🚀 サーバー起動中')).toBeVisible({ timeout: 15000 });
		await expect(page.getByText('初回接続時は30秒〜1分程度かかる場合があります')).toBeVisible();
	});
});

test.describe('モバイル表示', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test('小さい画面でもセットアップ操作ができる', async ({ page }) => {
		await setPlayerName(page, 'Alice');

		await expect(page.locator('.name-display')).toHaveText('Alice');
		await expect(page.locator('.icon-container')).toBeVisible();
	});
});
