<script lang="ts">
	import type { Participant } from '$lib/types';

	let {
		participant,
		isRevealed = false
	}: {
		participant: Participant;
		isRevealed?: boolean;
	} = $props();
</script>

<div class="participant-card">
	{#if participant.icon}
		<div class="icon">
			{@html participant.icon}
		</div>
	{/if}
	<p class="name">{participant.name}</p>
	<p class="vote">
		{#if isRevealed}
			{participant.vote || '-'}
		{:else}
			{participant.hasVoted ? '✓' : '-'}
		{/if}
	</p>
</div>

<style>
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

	.icon {
		width: 60px;
		height: 60px;
		margin: 0 auto 0.5rem;
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
</style>
