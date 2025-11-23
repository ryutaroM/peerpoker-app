<script lang="ts">
	import { getContext } from 'svelte';
	import type { PeerId, Participant } from '$lib/types';

	interface GameStateContext {
		peerId: string;
		participants: Map<PeerId, Participant>;
		vote: (value: string | number) => void;
	}

	const state = getContext<GameStateContext>('gameState');

	const voteOptions = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
	let selectedVote = $derived(state.participants.get(state.peerId)?.vote);
</script>

<div class="vote-cards">
	<h3>Your Estimate</h3>
	<div class="cards">
		{#each voteOptions as option}
			<button
				class="vote-card"
				class:selected={selectedVote === option}
				onclick={() => state.vote(option)}
			>
				{option}
			</button>
		{/each}
	</div>
</div>

<style>
	.vote-cards {
		margin: 2rem 0;
	}

	.vote-cards h3 {
		text-align: center;
		margin-bottom: 1rem;
		color: #333;
	}

	.cards {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.vote-card {
		width: 60px;
		height: 80px;
		border: 2px solid #ddd;
		border-radius: 8px;
		background: white;
		font-size: 1.5rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.vote-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-4px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.vote-card.selected {
		background-color: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
		transform: translateY(-4px);
	}
</style>
