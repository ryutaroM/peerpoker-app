import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import type { ComponentProps } from 'svelte';
import ConnectionDialog from './ConnectionDialog.svelte';

async function renderDialog(props: Partial<ComponentProps<typeof ConnectionDialog>> = {}) {
	const onConnect = vi.fn();
	const onCancel = vi.fn();
	await render(ConnectionDialog, {
		isOpen: true,
		isConnecting: false,
		isServerStarting: false,
		onConnect,
		onCancel,
		...props
	});
	return { onConnect, onCancel };
}

const connectButton = () => page.getByRole('button', { name: /接続開始|接続中/ });
const cancelButton = () => page.getByRole('button', { name: 'キャンセル' });

describe('ConnectionDialog', () => {
	it('isOpen が false なら何も描画しない', async () => {
		await renderDialog({ isOpen: false });

		expect(page.getByRole('dialog').elements()).toHaveLength(0);
	});

	it('isOpen が true ならダイアログと操作ボタンを表示する', async () => {
		await renderDialog();

		await expect.element(page.getByRole('dialog')).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'サーバーに接続' })).toBeVisible();
		await expect.element(connectButton()).toBeEnabled();
		await expect.element(cancelButton()).toBeEnabled();
	});

	it('接続開始ボタンで onConnect を呼ぶ', async () => {
		const { onConnect } = await renderDialog();

		await connectButton().click();

		expect(onConnect).toHaveBeenCalledTimes(1);
	});

	it('キャンセルボタンで onCancel を呼ぶ', async () => {
		const { onCancel } = await renderDialog();

		await cancelButton().click();

		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('オーバーレイのクリックで onCancel を呼ぶ', async () => {
		const { onCancel } = await renderDialog();

		(document.querySelector('.modal-overlay') as HTMLElement).click();

		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('ダイアログ本体のクリックは onCancel を呼ばない', async () => {
		const { onCancel } = await renderDialog();

		await page.getByRole('heading', { name: 'サーバーに接続' }).click();

		expect(onCancel).not.toHaveBeenCalled();
	});

	describe('接続中', () => {
		it('進捗表示を出し、両方のボタンを無効化する', async () => {
			await renderDialog({ isConnecting: true });

			await expect.element(page.getByText('サーバーに接続しています')).toBeVisible();
			await expect.element(connectButton()).toBeDisabled();
			await expect.element(cancelButton()).toBeDisabled();
		});

		it('サーバー起動待ちのときは起動中メッセージに切り替える', async () => {
			await renderDialog({ isConnecting: true, isServerStarting: true });

			await expect.element(page.getByText('🚀 サーバー起動中')).toBeVisible();
			await expect
				.element(page.getByText('初回接続時は30秒〜1分程度かかる場合があります', { exact: false }))
				.toBeVisible();
			expect(page.getByText('サーバーに接続しています').elements()).toHaveLength(0);
		});

		it('接続していないときは進捗表示を出さない', async () => {
			await renderDialog({ isConnecting: false, isServerStarting: true });

			expect(document.querySelector('.connection-status')).toBeNull();
		});
	});
});
