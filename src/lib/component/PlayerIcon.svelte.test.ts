import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import PlayerIcon from './PlayerIcon.svelte';

const { ICON } = vi.hoisted(() => ({
	ICON: '<svg data-testid="hero-icon" viewBox="0 0 100 100"></svg>'
}));

vi.mock('$lib/icons', () => ({
	heroIcons: [ICON],
	getRandomHeroIcon: () => ICON
}));

describe('PlayerIcon', () => {
	it('icon が未指定ならプレースホルダーの ? を表示する', async () => {
		await render(PlayerIcon, {});

		await expect.element(page.getByText('?')).toBeVisible();
	});

	it('icon が指定されていれば SVG を描画しプレースホルダーを出さない', async () => {
		await render(PlayerIcon, { icon: ICON });

		await expect.element(page.getByTestId('hero-icon')).toBeInTheDocument();
		expect(document.querySelector('.placeholder-icon')).toBeNull();
	});

	it('name が指定されていれば表示する', async () => {
		await render(PlayerIcon, { name: 'Alice' });

		await expect.element(page.getByText('Alice')).toBeVisible();
	});

	it('name が未指定なら名前表示を描画しない', async () => {
		await render(PlayerIcon, {});

		expect(document.querySelector('.name-display')).toBeNull();
	});

	it('クリックで onClick を呼ぶ', async () => {
		const onClick = vi.fn();
		await render(PlayerIcon, { onClick });

		await page.getByRole('button').click();

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	describe('接続状態の表現', () => {
		it('デフォルト (disconnected) では状態クラスを持たない', async () => {
			await render(PlayerIcon, {});

			const container = document.querySelector('.icon-container');
			expect(container?.className).not.toContain('connecting');
			expect(container?.className).not.toContain('connected');
		});

		it('connecting のとき connecting クラスを付与する', async () => {
			await render(PlayerIcon, { connectionStatus: 'connecting' });

			expect(document.querySelector('.icon-container')?.classList.contains('connecting')).toBe(
				true
			);
		});

		it('connected のとき connected クラスを付与する', async () => {
			await render(PlayerIcon, { connectionStatus: 'connected' });

			const container = document.querySelector('.icon-container');
			expect(container?.classList.contains('connected')).toBe(true);
			expect(container?.classList.contains('connecting')).toBe(false);
		});
	});
});
