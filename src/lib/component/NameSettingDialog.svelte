<script lang="ts">
	interface Props {
		isOpen: boolean;
		initialName?: string;
		onSave: (name: string) => void;
		onCancel: () => void;
	}

	let { isOpen = $bindable(), initialName = '', onSave, onCancel }: Props = $props();
	let name = $state('');

	$effect(() => {
		if (isOpen) {
			name = initialName;
		}
	});

	function handleSave() {
		if (name.trim()) {
			onSave(name.trim());
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && name.trim()) {
			handleSave();
		} else if (e.key === 'Escape') {
			onCancel();
		}
	}
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
			<h2>プレイヤー名を設定</h2>
			<div class="form-group">
				<label for="playerName">名前</label>
				<input
					id="playerName"
					type="text"
					placeholder="名前を入力してください"
					bind:value={name}
					onkeydown={handleKeydown}
					autofocus
				/>
			</div>
			<div class="button-group">
				<button class="secondary-btn" onclick={onCancel}>キャンセル</button>
				<button class="primary-btn" onclick={handleSave} disabled={!name.trim()}>保存</button>
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
		margin: 0 0 1.5rem 0;
		color: #333;
		text-align: center;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.form-group label {
		font-weight: 600;
		color: #555;
	}

	input {
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
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

	.secondary-btn:hover {
		background-color: #d0d0d0;
		transform: translateY(-2px);
	}
</style>
