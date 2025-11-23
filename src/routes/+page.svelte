<script lang="ts">
	import { PeerWrapper } from '$lib/peer';
	import type { Message, Participant, GameState } from '$lib/types';
	import { onMount } from 'svelte';

	let peerId = '';
	let playerName = '';
	let opponentId = '';
	let gameState: GameState = {
		participants: new Map(),
		isRevealed: false
	};
	let peerWrapper: PeerWrapper | null = null;
	let isConnected = false;

	function generatePeerId() {
		peerId = crypto.randomUUID();
	}

	function shareLink() {
		const url = `${window.location.origin}?connect_to=${peerId}`;
		navigator.clipboard.writeText(url);
		alert('リンクをコピーしました！');
	}

	function connectToOpponent() {
		console.log('=== connectToOpponent called ===');
		console.log('opponentId:', opponentId);
		console.log('peerWrapper:', peerWrapper);

		if (!opponentId || !peerWrapper) {
			console.log('Early return - opponentId or peerWrapper is missing');
			return;
		}

		console.log('Calling peerWrapper.connectTo with:', opponentId);
		peerWrapper.connectTo(opponentId);
	}

	function startGame() {
		if (!peerId || !playerName) return;

		peerWrapper = new PeerWrapper(peerId, handleData, handlePeerConnected, handlePeerDisconnected);
		peerWrapper.connect();
		isConnected = true;

		gameState.participants.set(peerId, {
			name: playerName,
			hasVoted: false
		});
	}

	function handleData(id: string, data: Message) {
		console.log(`Received data from ${id}:`, data);

		if (data.type === 'join') {
			const participantId = data.senderId; // 重要: メッセージ内のsenderIdを使用

			const newParticipants = new Map(gameState.participants);

			if (!newParticipants.has(participantId)) {
				newParticipants.set(participantId, {
					name: data.payload?.name || 'Unknown',
					hasVoted: false
				});
			} else {
				const participant = newParticipants.get(participantId);
				if (participant && data.payload?.name) {
					participant.name = data.payload.name;
				}
			}

			gameState.participants = newParticipants;
		}
	}

	function handlePeerConnected(id: string) {
		console.log(`Peer connected: ${id}`);

		if (peerWrapper) {
			gameState.participants.forEach((participant, participantId) => {
				const message: Message = {
					type: 'join',
					senderId: participantId,
					timestamp: Date.now(),
					payload: { name: participant.name }
				};
				console.log(`Sending participant info to ${id}:`, message);
				peerWrapper!.sendTo(id, message);
			});
		}

		const newParticipants = new Map(gameState.participants);
		newParticipants.set(id, {
			name: 'Connecting...',
			hasVoted: false
		});
		gameState.participants = newParticipants;
	}

	function handlePeerDisconnected(id: string) {
		console.log(`Peer disconnected: ${id}`);
		gameState.participants.delete(id);
	}

	onMount(() => {
		generatePeerId();

		// URLパラメータから相手のIDを取得
		const url = new URLSearchParams(window.location.search);
		const connectToId = url.get('connect_to');

		if (connectToId) {
			opponentId = connectToId;
		}
	});
</script>

<div class="container">
	{#if !isConnected}
		<div class="setup-form">
			<div class="form-group">
				<label for="playerName">Player Name</label>
				<input id="playerName" type="text" placeholder="Enter your name" bind:value={playerName} />
			</div>
			<button on:click={startGame} disabled={!playerName} class="primary-btn"> Start Game </button>
		</div>
	{:else}
		<div class="game-container">
			<div class="connection-panel">
				<div class="id-display">
					<span>Your ID:</span>
					<code>{peerId}</code>
				</div>
				<button on:click={shareLink} class="share-btn">🔗 Share Link</button>

				<div class="connect-section">
					<label for="opponentId">Opponent's ID</label>
					<input id="opponentId" type="text" placeholder="Opponent's ID" bind:value={opponentId} />
					<button on:click={connectToOpponent} class="connect-btn" disabled={!opponentId}>
						Connect
					</button>
				</div>
			</div>

			<div class="game-area">
				<h2>参加者: {gameState.participants.size}</h2>
				<div class="participants">
					{#each Array.from(gameState.participants.entries()) as [id, participant]}
						<div class="participant-card">
							<p class="name">{participant.name}</p>
							<p class="vote">{participant.vote || '-'}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

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

	.setup-form input,
	.connect-section input {
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
	}

	.primary-btn,
	.share-btn,
	.connect-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.primary-btn {
		background-color: #667eea;
		color: white;
	}

	.primary-btn:hover:not(:disabled) {
		background-color: #764ba2;
		transform: translateY(-2px);
	}

	.share-btn {
		background-color: #0066cc;
		color: white;
		width: 100%;
	}

	.share-btn:hover {
		background-color: #0052a3;
	}

	.connect-btn {
		background-color: #0066cc;
		color: white;
	}

	.connect-btn:hover:not(:disabled) {
		background-color: #0052a3;
	}

	.connect-section {
		display: flex;
		gap: 0.5rem;
	}

	.connect-section input {
		flex: 1;
	}

	.connection-panel {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.id-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.id-display code {
		background-color: #f0f0f0;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.9rem;
		color: #0066cc;
		flex: 1;
		overflow: auto;
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

	.participant-card {
		background: white;
		border: 2px solid #ddd;
		border-radius: 12px;
		padding: 1.5rem;
		text-align: center;
		transition: all 0.3s ease;
	}

	.participant-card:hover {
		border-color: #667eea;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
	}

	.participant-card .name {
		margin: 0;
		font-weight: 600;
		color: #333;
	}

	.participant-card .vote {
		margin: 1rem 0 0 0;
		font-size: 2.5rem;
		font-weight: bold;
		color: #667eea;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
