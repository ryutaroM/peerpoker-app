<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import GameState from '$lib/component/GameState.svelte';
	import ConnectionPanel from '$lib/component/ConnectionPanel.svelte';
	import ParticipantCard from '$lib/component/ParticipantCard.svelte';
	import type { PeerId, Participant } from '$lib/types';

	interface GameStateContext {
		peerId: string;
		playerName: string;
		participants: Map<PeerId, Participant>;
		isRevealed: boolean;
		isConnected: boolean;
		startGame: (name: string) => void;
		connectToOpponent: (opponentId: string) => void;
		vote: (value: string | number) => void;
		reveal: () => void;
		reset: () => void;
	}

	let opponentId = $state('');

	onMount(() => {
		const url = new URLSearchParams(window.location.search);
		const connectToId = url.get('connect_to');
		if (connectToId) {
			opponentId = connectToId;
		}
	});
</script>

<GameState>
	{#snippet children()}
		{@const state = getContext<GameStateContext>('gameState')}

		<div class="container">
			{#if !state.isConnected}
				<div class="setup-form">
					<div class="form-group">
						<label for="playerName">Player Name</label>
						<input
							id="playerName"
							type="text"
							placeholder="Enter your name"
							bind:value={state.playerName}
						/>
					</div>
					<button
						onclick={() => state.startGame(state.playerName)}
						disabled={!state.playerName}
						class="primary-btn"
					>
						Start Game
					</button>
				</div>
			{:else}
				<div class="game-container">
					<ConnectionPanel
						peerId={state.peerId}
						bind:opponentId
						onShareLink={() => {
							const url = `${window.location.origin}?connect_to=${state.peerId}`;
							navigator.clipboard.writeText(url);
							alert('リンクをコピーしました！');
						}}
						onConnect={() => state.connectToOpponent(opponentId)}
					/>

					<div class="game-area">
						<h2>参加者: {state.participants.size}</h2>
						<div class="participants">
							{#each Array.from(state.participants.entries()) as [id, participant]}
								<ParticipantCard {participant} isRevealed={state.isRevealed} />
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}
</GameState>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 600;
	}

	.setup-form input {
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
	}

	.primary-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.3s ease;
		background-color: #667eea;
		color: white;
	}

	.primary-btn:hover:not(:disabled) {
		background-color: #764ba2;
		transform: translateY(-2px);
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.game-area {
		text-align: center;
	}

	.participants {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}
</style>
