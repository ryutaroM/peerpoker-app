<script lang="ts">
	import { setContext, type Component } from 'svelte';

	/**
	 * `getContext('gameState')` に依存するコンポーネントを
	 * テストから直接 render するためのラッパー。
	 */
	let {
		value,
		component: Target
	}: {
		value: unknown;
		component: Component;
	} = $props();

	setContext('gameState', value);
</script>

<Target />
