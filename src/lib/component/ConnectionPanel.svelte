<script lang="ts">
	let {
		peerId,
		opponentId = $bindable(''),
		onShareLink,
		onConnect,
		isConnecting = false,
		isConnectingToPeer = false
	}: {
		peerId: string;
		opponentId: string;
		onShareLink: () => void;
		onConnect: () => void;
		isConnecting?: boolean;
		isConnectingToPeer?: boolean;
	} = $props();
</script>

<div class="connection-panel">
	{#if isConnecting}
		<div class="loading">
			<p class="loading-text">Connecting to signaling server <span class="inline-spinner"></span></p>
			<div class="spinner"></div>
		</div>
	{:else}
		<button onclick={onShareLink} class="share-btn">🔗 Share Link</button>
		<div class="id-display">
			<span>Your ID:</span>
			<code>{peerId}</code>
		</div>

		<div class="connect-section">
			<label for="opponentId">Opponent's ID</label>
			<input id="opponentId" type="text" placeholder="Opponent's ID" bind:value={opponentId} />
			<button onclick={onConnect} class="connect-btn" disabled={!opponentId || isConnectingToPeer}>
				{#if isConnectingToPeer}
					Connecting <span class="inline-spinner"></span>
				{:else}
					Connect
				{/if}
			</button>
		</div>
	{/if}
</div>

<style>
	.connection-panel {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.id-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 1rem;
	}

	.id-display span {
		white-space: nowrap;
		font-weight: 600;
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
		word-break: break-all;
	}

	.share-btn {
		background-color: #0066cc;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.share-btn:hover {
		background-color: #0052a3;
	}

	.connect-section {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
		flex-wrap: wrap;
	}

	.connect-section label {
		display: none;
	}

	.connect-section input {
		flex: 1;
		min-width: 200px;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
	}

	.connect-btn {
		background-color: #0066cc;
		color: white;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.3s ease;
		white-space: nowrap;
	}

	.connect-btn:hover:not(:disabled) {
		background-color: #0052a3;
	}

	.connect-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 600px) {
		.connect-section {
			flex-direction: column;
		}

		.connect-section input {
			min-width: 100%;
		}
	}

	.loading {
		text-align: center;
		padding: 2rem;
	}

	.loading-text {
		font-size: 1.2rem;
		color: #667eea;
		margin-bottom: 1rem;
	}

	.inline-spinner {
		display: inline-block;
		width: 14px;
		height: 14px;
		border: 2px solid rgba(102, 126, 234, 0.3);
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		vertical-align: middle;
	}

	.spinner {
		width: 40px;
		height: 40px;
		margin: 0 auto;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
