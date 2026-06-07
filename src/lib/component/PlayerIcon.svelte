<script lang="ts">
	interface Props {
		icon?: string;
		name?: string;
		onClick?: () => void;
	}

	let { icon, name, onClick }: Props = $props();
</script>

<button class="player-icon" onclick={onClick}>
	<div class="icon-container">
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
</style>
