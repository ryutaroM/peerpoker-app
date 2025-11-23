<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/component/Header.svelte';
	import Footer from '$lib/component/Footer.svelte';
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<title>PeerPoker - P2P Planning Poker</title>
	<meta
		name="description"
		content="A peer-to-peer planning poker application for agile teams. No central server, real-time voting, and instant consensus detection."
	/>
	<meta name="keywords" content="planning poker, agile, scrum, estimation, p2p, webrtc" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />

	<!-- Open Graph -->
	<meta property="og:title" content="PeerPoker - P2P Planning Poker" />
	<meta
		property="og:description"
		content="A peer-to-peer planning poker application for agile teams"
	/>
	<meta property="og:type" content="website" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="PeerPoker - P2P Planning Poker" />
	<meta
		name="twitter:description"
		content="A peer-to-peer planning poker application for agile teams"
	/>

	<!-- Slack unfurling -->
	<meta property="og:url" content="https://peerpoker.pages.dev" />
	<meta property="og:image" content="https://peerpoker.pages.dev/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
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
