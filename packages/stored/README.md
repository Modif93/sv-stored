# sv-stored

Zustand-style middleware composition for Svelte stores.

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

`createStored` returns a normal Svelte writable store plus helpers:

- `subscribe`, `set`, `update` — Svelte store contract
- `get()` — read current state synchronously
- `setState(partial, replace?, action?)` — shallow-merge partial object updates
- `select(selector, equality?)` — readable selector store
- `readonly()` — read-only facade
