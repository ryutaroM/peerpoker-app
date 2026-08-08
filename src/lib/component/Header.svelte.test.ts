import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Header from './Header.svelte';

describe('Header', () => {
	it('アプリ名を h1 見出しとして表示する', async () => {
		await render(Header);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeVisible();
		await expect.element(heading).toHaveTextContent('Peer Porker');
	});

	it('banner ロールの header 要素を描画する', async () => {
		await render(Header);

		await expect.element(page.getByRole('banner')).toBeVisible();
	});
});
