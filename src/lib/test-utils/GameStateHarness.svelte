<script lang="ts">
	import GameState from '$lib/component/GameState.svelte';
	import GameStateProbe from './GameStateProbe.svelte';

	let { onReady }: { onReady: (state: unknown) => void } = $props();
</script>

<GameState>
	<GameStateProbe {onReady} />
</GameState>
