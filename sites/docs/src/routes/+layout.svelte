<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<title>Stored</title>
	<meta name="description" content="Zustand-style middleware composition for Svelte stores." />
</svelte:head>

{@render children()}

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		color: #172033;
		background:
			radial-gradient(circle at top left, rgba(103, 83, 255, 0.18), transparent 28rem),
			linear-gradient(135deg, #f8fbff 0%, #eef2ff 48%, #f7f3ff 100%);
	}

	:global(button),
	:global(code),
	:global(pre) {
		font: inherit;
	}
</style>
