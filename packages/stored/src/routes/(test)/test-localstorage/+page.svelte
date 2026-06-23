<script lang="ts">
	import { createStored, persist } from '$lib/index.js';

	type Counter = {
		count: number;
		increment: () => void;
		reset: () => void;
	};

	const counter = createStored<Counter>(
		(set) => ({
			count: 0,
			increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
			reset: () => set({ count: 0 }, false, 'reset')
		}),
		{
			middlewares: [
				persist({
					name: 'stored-localstorage-test',
					partialize: (state) => ({ count: state.count })
				})
			]
		}
	);
	const count = counter.select((state) => state.count);

	function increment() {
		counter.get().increment();
	}

	function reset() {
		counter.get().reset();
	}
</script>

<svelte:head>
	<title>Stored localStorage test</title>
</svelte:head>

<main>
	<h1>localStorage persistence</h1>
	<p data-testid="count">{$count}</p>
	<button type="button" onclick={increment}>Increment</button>
	<button type="button" onclick={reset}>Reset</button>
</main>
