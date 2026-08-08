import { expect, test } from '@playwright/test';
import { mockSignalingServer, startGame } from './helpers';

const VOTE_OPTIONS = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89'];

const voteCard = (page: import('@playwright/test').Page, value: string) =>
	page.locator('.vote-card', { hasText: new RegExp(`^${value}$`) });

test.beforeEach(async ({ page }) => {
	await mockSignalingServer(page);
	await page.goto('/');
	await startGame(page, 'Alice');
});

test.describe('ゲーム画面への遷移', () => {
	test('サーバーに接続するとゲーム画面に切り替わる', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Your Estimate' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Planning Poker' })).toBeHidden();
		await expect(page.getByRole('dialog')).toBeHidden();
	});

	test('自分だけが参加者として並ぶ', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Participants: 1' })).toBeVisible();
		await expect(page.locator('.participant-card')).toHaveCount(1);
		await expect(page.locator('.participant-card .name')).toHaveText('Alice');
	});

	test('フィボナッチ数列の投票カードが並ぶ', async ({ page }) => {
		await expect(page.locator('.vote-card')).toHaveText(VOTE_OPTIONS);
	});

	test('公開前は Reveal Cards が押せる状態にある', async ({ page }) => {
		await expect(page.getByRole('button', { name: /Reveal Cards/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /New Round/ })).toBeHidden();
	});
});

test.describe('投票', () => {
	test('選んだカードが選択状態になる', async ({ page }) => {
		await voteCard(page, '8').click();

		await expect(voteCard(page, '8')).toHaveClass(/selected/);
		await expect(page.locator('.vote-card.selected')).toHaveCount(1);
	});

	test('公開前は自分の参加者カードに投票済みの印だけが出る', async ({ page }) => {
		await voteCard(page, '8').click();

		await expect(page.locator('.participant-card .vote')).toHaveText('✓');
	});

	test('別のカードを選び直すと選択が移る', async ({ page }) => {
		await voteCard(page, '8').click();
		await voteCard(page, '21').click();

		await expect(voteCard(page, '21')).toHaveClass(/selected/);
		await expect(voteCard(page, '8')).not.toHaveClass(/selected/);
	});

	test('0 のカードも選べる', async ({ page }) => {
		await voteCard(page, '0').click();

		await expect(voteCard(page, '0')).toHaveClass(/selected/);
	});
});

test.describe('公開とリセット', () => {
	test('公開すると投票値と New Round ボタンが現れる', async ({ page }) => {
		await voteCard(page, '13').click();

		await page.getByRole('button', { name: /Reveal Cards/ }).click();

		await expect(page.locator('.participant-card .vote')).toHaveText('13');
		await expect(page.getByRole('button', { name: /New Round/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /Reveal Cards/ })).toBeHidden();
	});

	test('全員の意見が揃うと合意バナーを表示する', async ({ page }) => {
		await voteCard(page, '13').click();

		await page.getByRole('button', { name: /Reveal Cards/ }).click();

		await expect(page.getByText('Everyone agrees!')).toBeVisible();
		await expect(page.locator('.copy-btn .value')).toHaveText('13');
	});

	test('合意バナーのボタンで値をクリップボードにコピーする', async ({ page }) => {
		await voteCard(page, '5').click();
		await page.getByRole('button', { name: /Reveal Cards/ }).click();

		const alertMessage = new Promise<string>((resolve) => {
			page.once('dialog', (dialog) => {
				resolve(dialog.message());
				return dialog.accept();
			});
		});
		await page.locator('.copy-btn').click();

		expect(await alertMessage).toBe('"5" copied to clipboard!');
	});

	test('New Round で投票を破棄して次のラウンドに戻す', async ({ page }) => {
		await voteCard(page, '13').click();
		await page.getByRole('button', { name: /Reveal Cards/ }).click();

		await page.getByRole('button', { name: /New Round/ }).click();

		await expect(page.locator('.participant-card .vote')).toHaveText('-');
		await expect(page.locator('.vote-card.selected')).toHaveCount(0);
		await expect(page.getByText('Everyone agrees!')).toBeHidden();
		await expect(page.getByRole('button', { name: /Reveal Cards/ })).toBeVisible();
	});

	test('リセット後にもう一度投票して公開できる', async ({ page }) => {
		await voteCard(page, '13').click();
		await page.getByRole('button', { name: /Reveal Cards/ }).click();
		await page.getByRole('button', { name: /New Round/ }).click();

		await voteCard(page, '34').click();
		await page.getByRole('button', { name: /Reveal Cards/ }).click();

		await expect(page.locator('.participant-card .vote')).toHaveText('34');
	});
});

test.describe('ゲーム中のメニュー', () => {
	test('自分の ID と相手への接続フォームを表示する', async ({ page }) => {
		await page.locator('.player-icon').click();

		await expect(page.locator('.id-code')).not.toBeEmpty();
		await expect(page.getByPlaceholder("Opponent's ID")).toBeVisible();
	});

	test('相手 ID が空の間は Connect を押せない', async ({ page }) => {
		await page.locator('.player-icon').click();

		await expect(page.getByRole('button', { name: 'Connect' })).toBeDisabled();
	});

	test('相手 ID を入力すると Connect が押せるようになる', async ({ page }) => {
		await page.locator('.player-icon').click();

		await page.getByPlaceholder("Opponent's ID").fill('other-peer-id');

		await expect(page.getByRole('button', { name: 'Connect' })).toBeEnabled();
	});

	test('Share Link で自分の ID 付き URL をコピーする', async ({ page }) => {
		await page.locator('.player-icon').click();
		const peerId = await page.locator('.id-code').innerText();

		const alertMessage = new Promise<string>((resolve) => {
			page.once('dialog', (dialog) => {
				resolve(dialog.message());
				return dialog.accept();
			});
		});
		await page.getByRole('button', { name: /Share Link/ }).click();

		expect(await alertMessage).toBe('Link copied!');
		expect(peerId).not.toHaveLength(0);
	});

	test('オーバーレイのクリックでメニューを閉じる', async ({ page }) => {
		await page.locator('.player-icon').click();

		await page.locator('.overlay').click();

		await expect(page.getByPlaceholder("Opponent's ID")).toBeHidden();
	});
});

test.describe('共有リンクからの参加', () => {
	test('connect_to パラメータが相手 ID の初期値になる', async ({ page }) => {
		await page.goto('/?connect_to=shared-peer-id');
		await startGame(page, 'Bob');

		await page.locator('.player-icon').click();

		await expect(page.getByPlaceholder("Opponent's ID")).toHaveValue('shared-peer-id');
		await expect(page.getByRole('button', { name: 'Connect' })).toBeEnabled();
	});
});

test.describe('モバイル表示', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test('小さい画面でも投票から公開まで操作できる', async ({ page }) => {
		await voteCard(page, '3').click();
		await page.getByRole('button', { name: /Reveal Cards/ }).click();

		await expect(page.locator('.participant-card .vote')).toHaveText('3');
	});
});
