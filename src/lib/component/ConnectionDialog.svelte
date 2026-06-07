<script lang="ts">
	interface Props {
		isOpen: boolean;
		isConnecting: boolean;
		onConnect: () => void;
		onCancel: () => void;
	}

	let { isOpen = $bindable(), isConnecting, onConnect, onCancel }: Props = $props();
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
</style>
