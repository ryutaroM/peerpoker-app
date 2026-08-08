import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import type { ComponentProps } from 'svelte';
import NameSettingDialog from './NameSettingDialog.svelte';

async function renderDialog(props: Partial<ComponentProps<typeof NameSettingDialog>> = {}) {
	const onSave = vi.fn();
	const onCancel = vi.fn();
	await render(NameSettingDialog, { isOpen: true, onSave, onCancel, ...props });
	return { onSave, onCancel };
}

const nameInput = () => page.getByLabelText('名前');
const saveButton = () => page.getByRole('button', { name: '保存' });
const cancelButton = () => page.getByRole('button', { name: 'キャンセル' });

describe('NameSettingDialog', () => {
	it('isOpen が false なら何も描画しない', async () => {
		await renderDialog({ isOpen: false });

		expect(page.getByRole('dialog').elements()).toHaveLength(0);
	});

	it('isOpen が true なら入力欄と操作ボタンを表示する', async () => {
		await renderDialog();

		await expect.element(page.getByRole('heading', { name: 'プレイヤー名を設定' })).toBeVisible();
		await expect.element(nameInput()).toBeVisible();
		await expect.element(cancelButton()).toBeEnabled();
	});

	it('initialName を入力欄の初期値にする', async () => {
		await renderDialog({ initialName: 'Alice' });

		await expect.element(nameInput()).toHaveValue('Alice');
	});

	it('名前が空のうちは保存ボタンを無効にする', async () => {
		await renderDialog();

		await expect.element(saveButton()).toBeDisabled();
	});

	it('空白のみの入力では保存ボタンを有効にしない', async () => {
		await renderDialog();

		await userEvent.fill(nameInput(), '   ');

		await expect.element(saveButton()).toBeDisabled();
	});

	it('名前を入力すると保存ボタンが有効になる', async () => {
		await renderDialog();

		await userEvent.fill(nameInput(), 'Bob');

		await expect.element(saveButton()).toBeEnabled();
	});

	it('保存ボタンで前後の空白を除いた名前を onSave に渡す', async () => {
		const { onSave } = await renderDialog();

		await userEvent.fill(nameInput(), '  Bob  ');
		await saveButton().click();

		expect(onSave).toHaveBeenCalledExactlyOnceWith('Bob');
	});

	it('Enter キーでも保存する', async () => {
		const { onSave } = await renderDialog();

		await userEvent.fill(nameInput(), 'Carol');
		await userEvent.keyboard('{Enter}');

		expect(onSave).toHaveBeenCalledExactlyOnceWith('Carol');
	});

	it('名前が空のまま Enter を押しても保存しない', async () => {
		const { onSave } = await renderDialog();

		await nameInput().click();
		await userEvent.keyboard('{Enter}');

		expect(onSave).not.toHaveBeenCalled();
	});

	it('入力欄で Escape を押すと onCancel を呼ぶ', async () => {
		const { onCancel } = await renderDialog();

		await nameInput().click();
		await userEvent.keyboard('{Escape}');

		expect(onCancel).toHaveBeenCalledTimes(1);
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

		await page.getByRole('heading', { name: 'プレイヤー名を設定' }).click();

		expect(onCancel).not.toHaveBeenCalled();
	});
});
