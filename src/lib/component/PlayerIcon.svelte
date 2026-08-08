<script lang="ts">
	interface Props {
		icon?: string;
		name?: string;
		onClick?: () => void;
		connectionStatus?: 'disconnected' | 'connecting' | 'connected';
	}

	let { icon, name, onClick, connectionStatus = 'disconnected' }: Props = $props();
</script>

<button class="player-icon" onclick={onClick}>
	<div
		class="icon-container"
		class:connecting={connectionStatus === 'connecting'}
		class:connected={connectionStatus === 'connected'}
	>
		{#if icon}
			{@html icon}
		{:else}
			<div class="placeholder-icon">?</div>
		{/if}
	</div>
	{#if name}
		<div class="name-display">{name}</div>
	{/if}
</button>

<style>
	.player-icon {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: transform 0.2s ease;
	}

	.player-icon:hover {
		transform: scale(1.05);
	}

	.player-icon:active {
		transform: scale(0.98);
	}

	.icon-container {
		width: 150px;
		height: 150px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
		padding: 15px;
		border: 3px solid rgba(255, 255, 255, 0.6);
		transition: all 0.2s ease;
	}

	.player-icon:hover .icon-container {
		box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
		border-color: rgba(255, 255, 255, 1);
		transform: translateY(-2px);
	}

	/* 接続中の状態 */
	.icon-container.connecting {
		border-color: #fbbf24;
		border-width: 4px;
		box-shadow: 0 8px 20px rgba(251, 191, 36, 0.4);
		animation: pulse 2s ease-in-out infinite;
	}

	/* 接続済みの状態 */
	.icon-container.connected {
		border-color: #10b981;
		border-width: 4px;
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 8px 20px rgba(251, 191, 36, 0.4);
		}
		50% {
			box-shadow: 0 8px 30px rgba(251, 191, 36, 0.7);
		}
	}

	.icon-container :global(svg) {
		width: 100%;
		height: 100%;
		background: white;
		border-radius: 50%;
		padding: 15%;
	}

	.placeholder-icon {
		font-size: 3rem;
		font-weight: bold;
		color: white;
	}

	.name-display {
		font-size: 1.3rem;
		font-weight: 700;
		text-align: center;
		color: #333;
		padding: 0.5rem 1rem;
		background: rgba(102, 126, 234, 0.1);
		border-radius: 12px;
		min-width: 150px;
	}

	/* 超小型スマホ対応 */
	@media (max-width: 400px) {
		.player-icon {
			gap: 0.5rem;
		}

		.icon-container {
			width: 80px;
			height: 80px;
			padding: 10px;
			border: 2px solid rgba(255, 255, 255, 0.6);
		}

		.icon-container.connecting,
		.icon-container.connected {
			border-width: 3px;
		}

		.placeholder-icon {
			font-size: 2rem;
		}

		.name-display {
			font-size: 1rem;
			padding: 0.25rem 0.5rem;
			min-width: 80px;
		}
	}
</style>
