<script lang="ts">
	interface Props {
		icon?: string;
		label?: string;
		disabled?: boolean;
		onClick?: () => void;
	}

	let { icon, label = 'Click to start', disabled = false, onClick }: Props = $props();
</script>

<button class="player-icon" {disabled} onclick={onClick}>
	<div class="icon-container">
		{#if icon}
			{@html icon}
		{:else}
			<div class="placeholder-icon">?</div>
		{/if}
	</div>
	{#if label}
		<div class="label">{label}</div>
	{/if}
</button>

<style>
	.player-icon {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		border: 3px solid #667eea;
		border-radius: 16px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		cursor: pointer;
		transition: all 0.3s ease;
		color: white;
		max-width: 300px;
		margin: 0 auto;
	}

	.player-icon:hover:not(:disabled) {
		transform: scale(1.05) translateY(-5px);
		box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
	}

	.player-icon:active:not(:disabled) {
		transform: scale(0.98);
	}

	.player-icon:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.icon-container {
		width: 120px;
		height: 120px;
		background: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.icon-container :global(svg) {
		width: 80%;
		height: 80%;
	}

	.placeholder-icon {
		font-size: 3rem;
		font-weight: bold;
		color: #667eea;
	}

	.label {
		font-size: 1.2rem;
		font-weight: 600;
		text-align: center;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
</style>
