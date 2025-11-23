<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/component/Header.svelte';
	import Footer from '$lib/component/Footer.svelte';
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Peer Porker</title>
</svelte:head>

<div class="app">
	<Header />
	<main>
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
		padding: 1rem;
		margin: 0 auto;
		width: 100%;
		max-width: 1200px;
		padding: 2rem;
		background-color: #f9f9f9;
	}
</style>
