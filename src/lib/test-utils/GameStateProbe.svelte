<script lang="ts">
	import { getContext } from 'svelte';

	/**
	 * GameState が provide する context をテスト側へ引き渡すだけの子コンポーネント。
	 */
	let { onReady }: { onReady: (state: unknown) => void } = $props();

	onReady(getContext('gameState'));
</script>
