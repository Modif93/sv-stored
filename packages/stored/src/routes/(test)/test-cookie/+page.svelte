<script lang="ts">
	import { createStored, persist } from '$lib/index.js';

	import type { PersistStorage } from '$lib/index.js';

	type Counter = {
		count: number;
		increment: () => void;
		reset: () => void;
	};

	const cookieStorage: PersistStorage = {
		getItem(key) {
			if (typeof document === 'undefined') return null;

			const cookie = document.cookie
				.split('; ')
				.find((item) => item.startsWith(`${encodeURIComponent(key)}=`));

			return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
		},
		setItem(key, value) {
			if (typeof document === 'undefined') return;

			document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
		},
		removeItem(key) {
			if (typeof document === 'undefined') return;

			document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
		}
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
					name: 'stored-cookie-test',
					storage: cookieStorage,
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
	<title>Stored cookie test</title>
</svelte:head>

<main>
	<h1>cookie persistence</h1>
	<p data-testid="count">{$count}</p>
	<button type="button" onclick={increment}>Increment</button>
	<button type="button" onclick={reset}>Reset</button>
</main>
