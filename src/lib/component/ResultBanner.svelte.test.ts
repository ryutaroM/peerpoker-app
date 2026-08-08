import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ContextHarness from '$lib/test-utils/ContextHarness.svelte';
import { createMockGameState, makeParticipants } from '$lib/test-utils/gameState.svelte';
import ResultBanner from './ResultBanner.svelte';

async function renderResultBanner(state: ReturnType<typeof createMockGameState>) {
	await render(ContextHarness, { value: state, component: ResultBanner });
}

const banner = () => page.getByText('Everyone agrees!');

afterEach(() => {
	vi.restoreAllMocks();
});

describe('ResultBanner', () => {
	it('未公開の間は全員一致でも表示しない', async () => {
		await renderResultBanner(
			createMockGameState({
				isRevealed: false,
				participants: makeParticipants([
					['me', { vote: 5, hasVoted: true }],
					['other', { vote: 5, hasVoted: true }]
				])
			})
		);

		expect(banner().elements()).toHaveLength(0);
	});

	it('公開後に全員の投票が一致したらバナーを表示する', async () => {
		await renderResultBanner(
			createMockGameState({
				isRevealed: true,
				participants: makeParticipants([
					['me', { vote: 5, hasVoted: true }],
					['other', { vote: 5, hasVoted: true }]
				])
			})
		);

		await expect.element(banner()).toBeVisible();
		await expect.element(page.getByRole('button')).toHaveTextContent('5');
	});

	it('投票が割れている場合は表示しない', async () => {
		await renderResultBanner(
			createMockGameState({
				isRevealed: true,
				participants: makeParticipants([
					['me', { vote: 5, hasVoted: true }],
					['other', { vote: 8, hasVoted: true }]
				])
			})
		);

		expect(banner().elements()).toHaveLength(0);
	});

	it('未投票の参加者は一致判定から除外する', async () => {
		await renderResultBanner(
			createMockGameState({
				isRevealed: true,
				participants: makeParticipants([
					['me', { vote: 3, hasVoted: true }],
					['other', { hasVoted: false }]
				])
			})
		);

		await expect.element(banner()).toBeVisible();
	});

	it('誰も投票していない場合は表示しない', async () => {
		await renderResultBanner(
			createMockGameState({
				isRevealed: true,
				participants: makeParticipants([['me', { hasVoted: false }]])
			})
		);

		expect(banner().elements()).toHaveLength(0);
	});

	it('全員が 0 に一致した場合もバナーを表示する', async () => {
		await renderResultBanner(
			createMockGameState({
				isRevealed: true,
				participants: makeParticipants([
					['me', { vote: 0, hasVoted: true }],
					['other', { vote: 0, hasVoted: true }]
				])
			})
		);

		await expect.element(banner()).toBeVisible();
		await expect.element(page.getByRole('button')).toHaveTextContent('0');
	});

	it('公開されるとバナーが現れる', async () => {
		const state = createMockGameState({
			isRevealed: false,
			participants: makeParticipants([
				['me', { vote: 13, hasVoted: true }],
				['other', { vote: 13, hasVoted: true }]
			])
		});
		await renderResultBanner(state);

		expect(banner().elements()).toHaveLength(0);

		state.isRevealed = true;

		await expect.element(banner()).toBeVisible();
	});

	it('コピーボタンで合意値をクリップボードに書き込み、確認ダイアログを出す', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
		const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

		await renderResultBanner(
			createMockGameState({
				isRevealed: true,
				participants: makeParticipants([['me', { vote: 21, hasVoted: true }]])
			})
		);

		await page.getByRole('button').click();

		expect(writeText).toHaveBeenCalledExactlyOnceWith('21');
		expect(alertSpy).toHaveBeenCalledExactlyOnceWith('"21" copied to clipboard!');

		vi.unstubAllGlobals();
	});
});
