<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import GameState from '$lib/component/GameState.svelte';
	import ParticipantCard from '$lib/component/ParticipantCard.svelte';
	import VoteCards from '$lib/component/VoteCards.svelte';
	import GameControls from '$lib/component/GameControls.svelte';
	import ResultBanner from '$lib/component/ResultBanner.svelte';
	import PlayerIcon from '$lib/component/PlayerIcon.svelte';
	import NameSettingDialog from '$lib/component/NameSettingDialog.svelte';
	import ConnectionDialog from '$lib/component/ConnectionDialog.svelte';
	import type { PeerId, Participant } from '$lib/types';

	interface GameStateContext {
		peerId: string;
		playerName: string;
		playerIcon: string;
		hasName: boolean;
		participants: Map<PeerId, Participant>;
		isRevealed: boolean;
		isConnected: boolean;
		isConnecting: boolean;
		isConnectingToPeer: boolean;
		setPlayerName: (name: string) => void;
		connectToServer: () => void;
		startGame: (name: string) => void;
		connectToOpponent: (opponentId: string) => void;
		vote: (value: string | number) => void;
		reveal: () => void;
		reset: () => void;
	}

	let opponentId = $state('');
	let showNameDialog = $state(false);
	let showConnectionDialog = $state(false);
	let showActionMenu = $state(false);
	let showActionMenuInGame = $state(false);

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
				<div class="setup-screen">
					<h1 class="title">Planning Poker</h1>
					<div class="icon-container-wrapper">
						<PlayerIcon
							icon={state.playerIcon}
							name={state.playerName}
							onClick={() => (showActionMenu = !showActionMenu)}
						/>
						{#if showActionMenu}
							<div class="action-menu">
								<button
									class="menu-item"
									onclick={() => {
										showNameDialog = true;
										showActionMenu = false;
									}}
								>
									<span class="menu-icon">✏️</span>
									<span class="menu-text">名前設定</span>
								</button>
								<button
									class="menu-item primary"
									onclick={() => {
										showConnectionDialog = true;
										showActionMenu = false;
									}}
									disabled={!state.hasName || state.isConnecting}
								>
									<span class="menu-icon">🎮</span>
									<span class="menu-text">
										{#if state.isConnecting}
											接続中<span class="dots"></span>
										{:else}
											ゲーム開始
										{/if}
									</span>
								</button>
							</div>
						{/if}
					</div>
				</div>
				{#if showActionMenu}
					<div
						class="overlay"
						role="button"
						tabindex="-1"
						onclick={() => (showActionMenu = false)}
						onkeydown={(e) => e.key === 'Escape' && (showActionMenu = false)}
					></div>
				{/if}

				<NameSettingDialog
					bind:isOpen={showNameDialog}
					initialName={state.playerName}
					onSave={(name) => {
						state.setPlayerName(name);
						showNameDialog = false;
					}}
					onCancel={() => {
						showNameDialog = false;
					}}
				/>

				<ConnectionDialog
					bind:isOpen={showConnectionDialog}
					isConnecting={state.isConnecting}
					onConnect={() => {
						state.connectToServer();
					}}
					onCancel={() => {
						showConnectionDialog = false;
					}}
				/>
			{:else}
				<div class="game-container">
					<div class="game-header">
						<div class="icon-container-wrapper">
							<PlayerIcon
								icon={state.playerIcon}
								name={state.playerName}
								onClick={() => (showActionMenuInGame = !showActionMenuInGame)}
							/>
							{#if showActionMenuInGame}
								<div class="action-menu">
									<button
										class="menu-item"
										onclick={() => {
											const url = `${window.location.origin}?connect_to=${state.peerId}`;
											navigator.clipboard.writeText(url);
											alert('Link copied!');
											showActionMenuInGame = false;
										}}
									>
										<span class="menu-icon">🔗</span>
										<span class="menu-text">Share Link</span>
									</button>
									<div class="menu-item info">
										<span class="menu-icon">🆔</span>
										<div class="id-info">
											<div class="id-label">Your ID:</div>
											<code class="id-code">{state.peerId}</code>
										</div>
									</div>
									<div class="menu-item connect-item">
										<span class="menu-icon">🤝</span>
										<div class="connect-form">
											<input
												type="text"
												placeholder="Opponent's ID"
												bind:value={opponentId}
												class="opponent-input"
											/>
											<button
												class="connect-button"
												onclick={() => {
													state.connectToOpponent(opponentId);
													showActionMenuInGame = false;
												}}
												disabled={!opponentId || state.isConnectingToPeer}
											>
												{#if state.isConnectingToPeer}
													Connecting<span class="dots"></span>
												{:else}
													Connect
												{/if}
											</button>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>

					{#if showActionMenuInGame}
						<div
							class="overlay"
							role="button"
							tabindex="-1"
							onclick={() => (showActionMenuInGame = false)}
							onkeydown={(e) => e.key === 'Escape' && (showActionMenuInGame = false)}
						></div>
					{/if}

					<VoteCards />

					<GameControls />

					<ResultBanner />

					<div class="game-area">
						<h2>Participants: {state.participants.size}</h2>
						<div class="participants">
							{#each Array.from(state.participants.entries()) as [id, participant] (id)}
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

	.setup-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		gap: 2rem;
	}

	.title {
		font-size: 3rem;
		font-weight: 700;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
		text-align: center;
	}

	.icon-container-wrapper {
		position: relative;
		display: inline-block;
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
	}

	.action-menu {
		position: absolute;
		top: 50%;
		left: calc(100% + 1.5rem);
		transform: translateY(-50%);
		background: white;
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 200px;
		z-index: 20;
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-50%) translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(-50%) translateX(0);
		}
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		border: none;
		border-radius: 12px;
		background: transparent;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s ease;
		text-align: left;
	}

	.menu-icon {
		font-size: 1.5rem;
	}

	.menu-text {
		flex: 1;
	}

	.menu-item:hover:not(:disabled) {
		background: rgba(102, 126, 234, 0.1);
		transform: translateX(3px);
	}

	.menu-item.primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.menu-item.primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.menu-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.dots::after {
		content: '';
		animation: dots 1.5s steps(4, end) infinite;
	}

	@keyframes dots {
		0%,
		20% {
			content: '';
		}
		40% {
			content: '.';
		}
		60% {
			content: '..';
		}
		80%,
		100% {
			content: '...';
		}
	}

	.game-header {
		margin-bottom: 2rem;
		display: flex;
		justify-content: center;
	}

	.menu-item.info {
		background: rgba(102, 126, 234, 0.05);
		cursor: default;
		padding: 1rem 1.25rem;
	}

	.menu-item.info:hover {
		background: rgba(102, 126, 234, 0.05);
		transform: none;
	}

	.id-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.id-label {
		font-size: 0.75rem;
		color: #666;
		font-weight: 500;
	}

	.id-code {
		background: white;
		padding: 0.5rem;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.85rem;
		color: #667eea;
		overflow: auto;
		word-break: break-all;
	}

	.menu-item.connect-item {
		flex-direction: column;
		gap: 0.5rem;
		cursor: default;
		background: rgba(102, 126, 234, 0.05);
	}

	.menu-item.connect-item:hover {
		background: rgba(102, 126, 234, 0.05);
		transform: none;
	}

	.connect-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.opponent-input {
		padding: 0.5rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 0.9rem;
		width: 100%;
	}

	.opponent-input:focus {
		outline: none;
		border-color: #667eea;
	}

	.connect-button {
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.connect-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
		transform: translateY(-1px);
	}

	.connect-button:disabled {
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
