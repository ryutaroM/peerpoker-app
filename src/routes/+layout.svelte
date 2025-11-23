<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/component/Header.svelte';
	import Footer from '$lib/component/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header />
<main>
	{@render children()}
</main>
<Footer />

<style>
	main {
		flex: 1;
	}
</style>
