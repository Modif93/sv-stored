import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { combine, createStored, logger, persist } from '$lib/index.js';

class MemoryStorage implements Storage {
	readonly #items = new Map<string, string>();

	get length() {
		return this.#items.size;
	}

	clear() {
		this.#items.clear();
	}

	getItem(key: string) {
		return this.#items.get(key) ?? null;
	}

	key(index: number) {
		return Array.from(this.#items.keys())[index] ?? null;
	}

	removeItem(key: string) {
		this.#items.delete(key);
	}

	setItem(key: string, value: string) {
		this.#items.set(key, value);
	}
}

type CounterState = {
	count: number;
	label: string;
	increment: () => void;
	reset: () => void;
};

function createCounter(storage?: Storage) {
	return createStored<CounterState>(
		(set) => ({
			count: 0,
			label: 'counter',
			increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
			reset: () => set({ count: 0 }, false, 'reset')
		}),
		{
			middlewares: storage
				? [
						persist({
							name: 'counter',
							storage,
							partialize: (state) => ({ count: state.count })
						})
					]
				: []
		}
	);
}

describe('createStored', () => {
	it('returns a Svelte writable store with synchronous get()', () => {
		const counter = createCounter();

		expect(get(counter).count).toBe(0);
		expect(counter.get().count).toBe(0);

		counter.get().increment();

		expect(get(counter).count).toBe(1);
		expect(counter.get().count).toBe(1);
	});

	it('shallow merges partial object updates by default', () => {
		const counter = createCounter();

		counter.setState({ count: 3 });

		expect(counter.get()).toMatchObject({ count: 3, label: 'counter' });
		expect(counter.get().increment).toBeTypeOf('function');
	});

	it('replaces state when replace is true', () => {
		const store = createStored<{ value: number; untouched?: boolean }>(() => ({
			value: 1,
			untouched: true
		}));

		store.setState({ value: 2 }, true);

		expect(store.get()).toEqual({ value: 2 });
	});

	it('creates selector stores with custom equality', () => {
		const store = createStored(() => ({ count: 0, other: 'a' }));
		const count = store.select(
			(state) => ({ count: state.count }),
			(left, right) => {
				return left.count === right.count;
			}
		);
		const subscriber = vi.fn();

		const unsubscribe = count.subscribe(subscriber);
		store.setState({ other: 'b' });
		store.setState({ count: 1 });
		unsubscribe();

		expect(subscriber).toHaveBeenCalledTimes(2);
		expect(subscriber).toHaveBeenLastCalledWith({ count: 1 });
	});

	it('exposes a read-only facade', () => {
		const counter = createCounter();
		const readonly = counter.readonly();

		expect(readonly).toHaveProperty('subscribe');
		expect(readonly).not.toHaveProperty('set');
		expect(get(readonly).count).toBe(0);
	});
});

describe('middleware', () => {
	let storage: MemoryStorage;

	beforeEach(() => {
		storage = new MemoryStorage();
	});

	it('persists partialized state and rehydrates it', () => {
		const counter = createCounter(storage);

		counter.get().increment();

		expect(JSON.parse(storage.getItem('counter') ?? '{}')).toEqual({ count: 1 });

		const rehydrated = createCounter(storage);

		expect(rehydrated.get()).toMatchObject({ count: 1, label: 'counter' });
		expect(rehydrated.get().increment).toBeTypeOf('function');
	});

	it('logs previous and next state', () => {
		const groupCollapsed = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
		const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		const groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

		const store = createStored<{ count: number; increment: () => void }>(
			(set) => ({
				count: 0,
				increment: () => set({ count: 1 }, false, 'increment')
			}),
			[logger('counter')]
		);

		store.get().increment();

		expect(groupCollapsed).toHaveBeenCalledWith('[counter] increment');
		expect(consoleLog).toHaveBeenCalledWith('previous', expect.objectContaining({ count: 0 }));
		expect(consoleLog).toHaveBeenCalledWith('next', expect.objectContaining({ count: 1 }));
		expect(groupEnd).toHaveBeenCalled();
	});

	it('combines initial state and actions', () => {
		type CombinedCounterState = { count: number };
		type CombinedCounterActions = { increment: () => void };

		const store = createStored(
			combine<CombinedCounterState, CombinedCounterActions>({ count: 0 }, (set) => ({
				increment: () => set((state) => ({ count: state.count + 1 }))
			}))
		);

		store.get().increment();

		expect(store.get().count).toBe(1);
	});
});
