<script lang="ts">
	import { getContext } from 'svelte';
	import type { PeerId, Participant } from '$lib/types';

	interface GameStateContext {
		participants: Map<PeerId, Participant>;
		isRevealed: boolean;
		reveal: () => void;
		reset: () => void;
	}

	const state = getContext<GameStateContext>('gameState');

	// every participant has voted
	let allVoted = $derived(Array.from(state.participants.values()).every((p) => p.hasVoted));
</script>

<div class="game-controls">
	{#if !state.isRevealed}
		<button class="control-btn reveal-btn" onclick={() => state.reveal()} disabled={!allVoted}>
			🎴 Reveal Cards
		</button>
	{:else}
		<button class="control-btn reset-btn" onclick={() => state.reset()}> 🔄 New Round </button>
	{/if}
</div>

<style>
	.game-controls {
		display: flex;
		justify-content: center;
		margin: 2rem 0;
		gap: 1rem;
	}

	.control-btn {
		padding: 1rem 2rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1.1rem;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.reveal-btn {
		background-color: var(--color-primary);
		color: white;
	}

	.reveal-btn:hover:not(:disabled) {
		background-color: var(--color-secondary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.reveal-btn:disabled {
		background-color: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.reset-btn {
		background-color: #28a745;
		color: white;
	}

	.reset-btn:hover {
		background-color: #218838;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
	}
</style>
