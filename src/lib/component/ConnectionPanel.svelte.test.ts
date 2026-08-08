import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import type { ComponentProps } from 'svelte';
import ConnectionPanel from './ConnectionPanel.svelte';

async function renderPanel(props: Partial<ComponentProps<typeof ConnectionPanel>> = {}) {
	const onShareLink = vi.fn();
	const onConnect = vi.fn();
	await render(ConnectionPanel, {
		peerId: 'my-peer-id',
		opponentId: '',
		onShareLink,
		onConnect,
		...props
	});
	return { onShareLink, onConnect };
}

const opponentInput = () => page.getByLabelText("Opponent's ID");
const connectButton = () => page.getByRole('button', { name: /^Connect/ });
const shareButton = () => page.getByRole('button', { name: /Share Link/ });

describe('ConnectionPanel', () => {
	it('自分の peerId を表示する', async () => {
		await renderPanel({ peerId: 'abc-123' });

		await expect.element(page.getByText('abc-123')).toBeVisible();
	});

	it('相手 ID が空の間は Connect ボタンを無効にする', async () => {
		await renderPanel();

		await expect.element(connectButton()).toBeDisabled();
	});

	it('相手 ID を入力すると Connect ボタンが有効になる', async () => {
		await renderPanel();

		await userEvent.fill(opponentInput(), 'other-peer');

		await expect.element(connectButton()).toBeEnabled();
	});

	it('Connect ボタンで onConnect を呼ぶ', async () => {
		const { onConnect } = await renderPanel({ opponentId: 'other-peer' });

		await connectButton().click();

		expect(onConnect).toHaveBeenCalledTimes(1);
	});

	it('Share Link ボタンで onShareLink を呼ぶ', async () => {
		const { onShareLink } = await renderPanel();

		await shareButton().click();

		expect(onShareLink).toHaveBeenCalledTimes(1);
	});

	it('ピア接続中は Connect ボタンを無効にし Connecting と表示する', async () => {
		await renderPanel({ opponentId: 'other-peer', isConnectingToPeer: true });

		await expect.element(connectButton()).toBeDisabled();
		await expect.element(connectButton()).toHaveTextContent('Connecting');
	});

	describe('シグナリングサーバー接続中', () => {
		it('ローディング表示に切り替える', async () => {
			await renderPanel({ isConnecting: true });

			await expect
				.element(page.getByText('Connecting to signaling server', { exact: false }))
				.toBeVisible();
		});

		it('ID 表示や接続フォームは描画しない', async () => {
			await renderPanel({ isConnecting: true, peerId: 'abc-123' });

			expect(page.getByText('abc-123').elements()).toHaveLength(0);
			expect(connectButton().elements()).toHaveLength(0);
			expect(shareButton().elements()).toHaveLength(0);
		});
	});
});
