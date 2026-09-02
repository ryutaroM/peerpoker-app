import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ParticipantCard from './ParticipantCard.svelte';
import type { Participant } from '$lib/types';

const { ICON } = vi.hoisted(() => ({
	ICON: '<svg data-testid="hero-icon" viewBox="0 0 100 100"></svg>'
}));

vi.mock('$lib/icons', () => ({
	heroIcons: [ICON],
	getRandomHeroIcon: () => ICON
}));

function participant(overrides: Partial<Participant> = {}): Participant {
	return { name: 'Alice', hasVoted: false, ...overrides };
}

describe('ParticipantCard', () => {
	it('参加者名を表示する', async () => {
		await render(ParticipantCard, { participant: participant({ name: 'Bob' }) });

		await expect.element(page.getByText('Bob')).toBeVisible();
	});

	it('icon が指定されていれば SVG を描画する', async () => {
		await render(ParticipantCard, { participant: participant({ icon: ICON }) });

		await expect.element(page.getByTestId('hero-icon')).toBeInTheDocument();
	});

	it('icon が未指定ならアイコン領域を描画しない', async () => {
		await render(ParticipantCard, { participant: participant() });

		expect(document.querySelector('.icon')).toBeNull();
	});

	describe('未公開のとき (isRevealed=false)', () => {
		it('投票済みなら ✓ を表示し、投票値は隠す', async () => {
			await render(ParticipantCard, {
				participant: participant({ hasVoted: true, vote: 8 }),
				isRevealed: false
			});

			await expect.element(page.getByText('✓')).toBeVisible();
			expect(page.getByText('8').elements()).toHaveLength(0);
		});

		it('未投票なら - を表示する', async () => {
			await render(ParticipantCard, { participant: participant({ hasVoted: false }) });

			await expect.element(page.getByText('-')).toBeVisible();
		});

		it('isRevealed 未指定時は未公開として扱う', async () => {
			await render(ParticipantCard, { participant: participant({ hasVoted: true, vote: 13 }) });

			await expect.element(page.getByText('✓')).toBeVisible();
		});
	});

	describe('公開後 (isRevealed=true)', () => {
		it('投票値を表示する', async () => {
			await render(ParticipantCard, {
				participant: participant({ hasVoted: true, vote: 21 }),
				isRevealed: true
			});

			await expect.element(page.getByText('21')).toBeVisible();
		});

		it('投票値が 0 でも - ではなく 0 を表示する', async () => {
			await render(ParticipantCard, {
				participant: participant({ hasVoted: true, vote: 0 }),
				isRevealed: true
			});

			await expect.element(page.getByText('0')).toBeVisible();
		});

		it('未投票なら - を表示する', async () => {
			await render(ParticipantCard, {
				participant: participant({ hasVoted: false }),
				isRevealed: true
			});

			await expect.element(page.getByText('-')).toBeVisible();
		});
	});
});
