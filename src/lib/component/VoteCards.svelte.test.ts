import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ContextHarness from '$lib/test-utils/ContextHarness.svelte';
import { createMockGameState, makeParticipants } from '$lib/test-utils/gameState.svelte';
import VoteCards from './VoteCards.svelte';

const VOTE_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

async function renderVoteCards(state: ReturnType<typeof createMockGameState>) {
	await render(ContextHarness, { value: state, component: VoteCards });
}

describe('VoteCards', () => {
	it('フィボナッチ数列の投票カードを並べる', async () => {
		await renderVoteCards(createMockGameState());

		const cards = document.querySelectorAll('.vote-card');
		expect(Array.from(cards).map((card) => card.textContent?.trim())).toEqual(
			VOTE_OPTIONS.map(String)
		);
	});

	it('見出しを表示する', async () => {
		await renderVoteCards(createMockGameState());

		await expect.element(page.getByRole('heading', { name: 'Your Estimate' })).toBeVisible();
	});

	it('カードをクリックするとその値で vote を呼ぶ', async () => {
		const state = createMockGameState();
		await renderVoteCards(state);

		await page.getByRole('button', { name: '13', exact: true }).click();

		expect(state.vote).toHaveBeenCalledExactlyOnceWith(13);
	});

	it('0 のカードも数値 0 として vote に渡す', async () => {
		const state = createMockGameState();
		await renderVoteCards(state);

		await page.getByRole('button', { name: '0', exact: true }).click();

		expect(state.vote).toHaveBeenCalledExactlyOnceWith(0);
	});

	it('自分の投票済みカードに selected クラスを付ける', async () => {
		const state = createMockGameState({
			peerId: 'me',
			participants: makeParticipants([['me', { vote: 8, hasVoted: true }]])
		});
		await renderVoteCards(state);

		const selected = document.querySelectorAll('.vote-card.selected');
		expect(selected).toHaveLength(1);
		expect(selected[0].textContent?.trim()).toBe('8');
	});

	it('他の参加者の投票では selected にならない', async () => {
		const state = createMockGameState({
			peerId: 'me',
			participants: makeParticipants([
				['me', {}],
				['other', { vote: 8, hasVoted: true }]
			])
		});
		await renderVoteCards(state);

		expect(document.querySelectorAll('.vote-card.selected')).toHaveLength(0);
	});

	it('投票が更新されると selected も追従する', async () => {
		const state = createMockGameState({ peerId: 'me' });
		await renderVoteCards(state);

		expect(document.querySelectorAll('.vote-card.selected')).toHaveLength(0);

		state.participants = makeParticipants([['me', { vote: 21, hasVoted: true }]]);

		await expect
			.poll(() => document.querySelector('.vote-card.selected')?.textContent?.trim())
			.toBe('21');
	});
});
