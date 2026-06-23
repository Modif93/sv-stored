# Stored

Stored extends [Svelte stores](https://svelte.dev/docs/svelte/svelte-store) with [Zustand](https://zustand-demo.pmnd.rs/)-style middleware composition.

- Small, composable utilities inspired by [Runed](https://runed.dev/)
- Keeps the Svelte store contract: `subscribe`, `set`, and `update`
- Supports the Zustand-like `createStored((set, get, api) => state, { middlewares })` pattern
- Provides built-in helpers such as `persist`, `logger`, and selector stores

## Packages

```txt
packages/stored  # sv-stored library
sites/docs       # SvelteKit documentation site
```

## Install

```sh
pnpm add sv-stored
```

## Quick start

```ts
import { createStored, logger, persist } from 'sv-stored';

type Counter = {
	count: number;
	increment: () => void;
	reset: () => void;
};

export const counter = createStored<Counter>(
	(set) => ({
		count: 0,
		increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
		reset: () => set({ count: 0 }, false, 'reset')
	}),
	{
		middlewares: [persist({ name: 'counter' }), logger('counter')]
	}
);

export const count = counter.select((state) => state.count);
```

Use it like any Svelte store:

```svelte
<script lang="ts">
	import { counter, count } from './counter';
</script>

<button onclick={() => $counter.increment()}>
	Count: {$count}
</button>
```

## Core API

### `createStored`

Creates a Svelte writable store with Zustand-like helpers.

```ts
const store = createStored((set, get, api) => initialState, {
	middlewares: []
});
```

Returned store includes:

- `subscribe`, `set`, `update` — standard Svelte writable store contract
- `get()` — synchronously read the current state snapshot
- `setState(partial, replace?, action?)` — partial update with shallow object merge
- `select(selector, equality?)` — create a readable selector store
- `readonly()` — expose a read-only store facade

### `persist`

Persists serializable state to `localStorage` by default.

```ts
persist({
	name: 'counter',
	partialize: (state) => ({ count: state.count })
});
```

### `logger`

Logs previous and next state when `setState` runs.

```ts
logger('counter');
```

### `combine`

Combines initial state and action creators.

```ts
const creator = combine({ count: 0 }, (set) => ({
	increment: () => set((state) => ({ count: state.count + 1 }))
}));
```

## Development

Install dependencies:

```sh
pnpm install
```

Run the docs site:

```sh
pnpm -F docs dev
```

Type-check all workspaces:

```sh
pnpm check
```

Build all workspaces:

```sh
pnpm build
```

Build only the package:

```sh
pnpm -F sv-stored build
```

## Publishing

The package is published from `packages/stored` as `sv-stored`.

```sh
pnpm -F sv-stored build
pnpm -F sv-stored publish
```

## License

MIT
