import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ContextHarness from '$lib/test-utils/ContextHarness.svelte';
import { createMockGameState, makeParticipants } from '$lib/test-utils/gameState.svelte';
import GameControls from './GameControls.svelte';

async function renderGameControls(state: ReturnType<typeof createMockGameState>) {
	await render(ContextHarness, { value: state, component: GameControls });
}

const revealButton = () => page.getByRole('button', { name: /Reveal Cards/ });
const resetButton = () => page.getByRole('button', { name: /New Round/ });

describe('GameControls', () => {
	describe('未公開のとき', () => {
		it('未投票者がいる間は Reveal Cards を無効にする', async () => {
			await renderGameControls(
				createMockGameState({
					participants: makeParticipants([
						['me', { vote: 5, hasVoted: true }],
						['other', { hasVoted: false }]
					])
				})
			);

			await expect.element(revealButton()).toBeDisabled();
		});

		it('全員が投票し終えると Reveal Cards を有効にする', async () => {
			await renderGameControls(
				createMockGameState({
					participants: makeParticipants([
						['me', { vote: 5, hasVoted: true }],
						['other', { vote: 8, hasVoted: true }]
					])
				})
			);

			await expect.element(revealButton()).toBeEnabled();
		});

		it('最後の 1 人が投票した時点で有効に変わる', async () => {
			const state = createMockGameState({
				participants: makeParticipants([
					['me', { vote: 5, hasVoted: true }],
					['other', { hasVoted: false }]
				])
			});
			await renderGameControls(state);

			await expect.element(revealButton()).toBeDisabled();

			state.participants = makeParticipants([
				['me', { vote: 5, hasVoted: true }],
				['other', { vote: 3, hasVoted: true }]
			]);

			await expect.element(revealButton()).toBeEnabled();
		});

		it('クリックで reveal を呼ぶ', async () => {
			const state = createMockGameState({
				participants: makeParticipants([['me', { vote: 5, hasVoted: true }]])
			});
			await renderGameControls(state);

			await revealButton().click();

			expect(state.reveal).toHaveBeenCalledTimes(1);
		});

		it('New Round ボタンは表示しない', async () => {
			await renderGameControls(createMockGameState());

			expect(resetButton().elements()).toHaveLength(0);
		});
	});

	describe('公開後のとき', () => {
		it('New Round ボタンに切り替える', async () => {
			await renderGameControls(createMockGameState({ isRevealed: true }));

			await expect.element(resetButton()).toBeVisible();
			expect(revealButton().elements()).toHaveLength(0);
		});

		it('クリックで reset を呼ぶ', async () => {
			const state = createMockGameState({ isRevealed: true });
			await renderGameControls(state);

			await resetButton().click();

			expect(state.reset).toHaveBeenCalledTimes(1);
		});

		it('isRevealed が false に戻ると Reveal Cards に戻る', async () => {
			const state = createMockGameState({
				isRevealed: true,
				participants: makeParticipants([['me', { vote: 5, hasVoted: true }]])
			});
			await renderGameControls(state);

			await expect.element(resetButton()).toBeVisible();

			state.isRevealed = false;

			await expect.element(revealButton()).toBeVisible();
		});
	});
});
