<script lang="ts">
	import { getContext } from 'svelte';
	import type { PeerId, Participant, Vote } from '$lib/types';

	interface GameStateContext {
		participants: Map<PeerId, Participant>;
		isRevealed: boolean;
	}

	const state = getContext<GameStateContext>('gameState');

	// 全員の投票を取得
	let votes = $derived(
		Array.from(state.participants.values())
			.filter((p) => p.hasVoted && p.vote !== undefined)
			.map((p) => p.vote)
	);

	// Check if all votes are the same
	let allAgree = $derived(
		state.isRevealed && votes.length > 0 && votes.every((v) => v === votes[0])
	);

	// Value that everyone agreed on
	let agreedValue = $derived(allAgree ? votes[0] : null);

	function copyToClipboard() {
		if (agreedValue !== null) {
			navigator.clipboard.writeText(String(agreedValue));
			alert(`"${agreedValue}" copied to clipboard!`);
		}
	}
</script>

{#if allAgree && agreedValue !== null}
	<div class="result-banner">
		<div class="banner-content">
			<span class="emoji">🎉</span>
			<span class="message">Everyone agrees!</span>
			<button class="copy-btn" onclick={copyToClipboard}>
				<span class="value">{agreedValue}</span>
				<span class="copy-icon">📋</span>
			</button>
		</div>
	</div>
{/if}

<style>
	.result-banner {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin: 2rem 0;
		box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
		animation: slideDown 0.5s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.banner-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.emoji {
		font-size: 2rem;
		animation: bounce 1s infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.message {
		font-size: 1.5rem;
		font-weight: bold;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: white;
		color: var(--color-primary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1.5rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.copy-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.copy-btn:active {
		transform: scale(0.95);
	}

	.value {
		font-size: 2rem;
	}

	.copy-icon {
		font-size: 1.2rem;
	}

	@media (max-width: 600px) {
		.banner-content {
			flex-direction: column;
		}

		.message {
			font-size: 1.2rem;
		}
	}
</style>
