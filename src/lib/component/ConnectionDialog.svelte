<script lang="ts">
	interface Props {
		isOpen: boolean;
		isConnecting: boolean;
		isServerStarting: boolean;
		onConnect: () => void;
		onCancel: () => void;
	}

	let { isOpen = $bindable(), isConnecting, isServerStarting, onConnect, onCancel }: Props =
		$props();
</script>

{#if isOpen}
	<div
		class="modal-overlay"
		onclick={onCancel}
		onkeydown={(e) => e.key === 'Escape' && onCancel()}
		role="presentation"
	>
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<h2>サーバーに接続</h2>
			<p class="description">
				Planning Pokerセッションを開始します。<br />接続後、他のプレイヤーとゲームを楽しめます。
			</p>

			{#if isConnecting}
				<div class="connection-status">
					<div class="spinner"></div>
					{#if isServerStarting}
						<div class="status-text server-starting">
							<div class="status-title">🚀 サーバー起動中</div>
							<div class="status-subtitle">
								サーバーが起動しています...<br />
								初回接続時は30秒〜1分程度かかる場合があります
							</div>
						</div>
					{:else}
						<div class="status-text">
							<div class="status-title">接続中<span class="dots"></span></div>
							<div class="status-subtitle">サーバーに接続しています</div>
						</div>
					{/if}
					<div class="progress-bar">
						<div class="progress-fill"></div>
					</div>
				</div>
			{/if}

			<div class="button-group">
				<button class="secondary-btn" onclick={onCancel} disabled={isConnecting}>
					キャンセル
				</button>
				<button class="primary-btn" onclick={onConnect} disabled={isConnecting}>
					{#if isConnecting}
						接続中<span class="dots"></span>
					{:else}
						接続開始
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		max-width: 400px;
		width: 90%;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	h2 {
		margin: 0 0 1rem 0;
		color: #333;
		text-align: center;
	}

	.description {
		text-align: center;
		color: #666;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.primary-btn,
	.secondary-btn {
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

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.secondary-btn {
		background-color: #e0e0e0;
		color: #555;
	}

	.secondary-btn:hover:not(:disabled) {
		background-color: #d0d0d0;
		transform: translateY(-2px);
	}

	.secondary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.connection-status {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid rgba(102, 126, 234, 0.2);
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.status-text {
		text-align: center;
	}

	.status-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.status-subtitle {
		font-size: 0.9rem;
		color: #666;
		line-height: 1.5;
	}

	.server-starting .status-title {
		color: #667eea;
		font-size: 1.2rem;
	}

	.server-starting .status-subtitle {
		color: #555;
		font-weight: 500;
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background: rgba(102, 126, 234, 0.2);
		border-radius: 3px;
		overflow: hidden;
		margin-top: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		border-radius: 3px;
		animation: progress 2s ease-in-out infinite;
	}

	@keyframes progress {
		0% {
			width: 0%;
			transform: translateX(0);
		}
		50% {
			width: 70%;
		}
		100% {
			width: 100%;
			transform: translateX(0);
		}
	}
</style>
