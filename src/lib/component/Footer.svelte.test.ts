import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Footer from './Footer.svelte';

describe('Footer', () => {
	it('contentinfo ロールの footer を描画する', async () => {
		await render(Footer);

		await expect.element(page.getByRole('contentinfo')).toBeVisible();
	});

	it('著作権表示を含む', async () => {
		await render(Footer);

		await expect.element(page.getByText('© 2025 Peer Porker. All rights reserved.')).toBeVisible();
	});
});
