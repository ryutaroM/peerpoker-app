<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import GameState from '$lib/component/GameState.svelte';
	import ConnectionPanel from '$lib/component/ConnectionPanel.svelte';
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
					<PlayerIcon
						icon={state.playerIcon}
						label={state.hasName ? 'サーバーに接続' : '名前を設定してください'}
						disabled={state.isConnecting}
						onClick={() => {
							if (!state.hasName) {
								showNameDialog = true;
							} else {
								showConnectionDialog = true;
							}
						}}
					/>
				</div>

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
					<ConnectionPanel
						peerId={state.peerId}
						bind:opponentId
						isConnecting={state.isConnecting}
						isConnectingToPeer={state.isConnectingToPeer}
						onShareLink={() => {
							const url = `${window.location.origin}?connect_to=${state.peerId}`;
							navigator.clipboard.writeText(url);
							alert('copied link!');
						}}
						onConnect={() => state.connectToOpponent(opponentId)}
					/>

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
