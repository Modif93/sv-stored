import { derived, writable } from 'svelte/store';

import type { Readable, Subscriber, Unsubscriber, Writable } from 'svelte/store';

export type EqualityFn<T> = (left: T, right: T) => boolean;

export type SetState<T> = (partial: PartialState<T>, replace?: boolean, action?: string) => void;

export type GetState<T> = () => T;

export type StateUpdater<T> = (state: T) => T | Partial<T>;

export type PartialState<T> = T | Partial<T> | StateUpdater<T>;

export type StateCreator<T> = (set: SetState<T>, get: GetState<T>, api: Stored<T>) => T;

export type Middleware<T> = (creator: StateCreator<T>) => StateCreator<T>;

export interface Stored<T> extends Writable<T> {
	/** Read the current snapshot without creating a subscription. */
	get: GetState<T>;
	/** Zustand-style partial updater. Object states are shallow-merged unless replace is true. */
	setState: SetState<T>;
	/** Create a readable projection of this store. */
	select: <Selected>(
		selector: (state: T) => Selected,
		equality?: EqualityFn<Selected>
	) => Readable<Selected>;
	/** Return a read-only Svelte store facade. */
	readonly: () => Readable<T>;
}

export interface CreateStoredOptions<T> {
	middlewares?: Array<Middleware<T>>;
}

export interface PersistOptions<T, Persisted = Partial<T>> {
	/** Storage key. */
	name: string;
	/** Defaults to localStorage when available. */
	storage?: PersistStorage;
	/** Convert state before serializing. Useful for omitting actions/functions. */
	partialize?: (state: T) => Persisted;
	/** Merge persisted data into the freshly-created state. */
	merge?: (persisted: Persisted, current: T) => T;
	serialize?: (value: Persisted) => string;
	deserialize?: (value: string) => Persisted;
	onRehydrateStorage?: (state: T) => void;
	onPersistError?: (error: unknown) => void;
}

export interface PersistStorage {
	getItem: (key: string) => string | null | Promise<string | null>;
	setItem: (key: string, value: string) => void | Promise<void>;
	removeItem?: (key: string) => void | Promise<void>;
}

const objectPrototype = Object.prototype;

export function createStored<T>(
	creator: StateCreator<T>,
	options: CreateStoredOptions<T> | Array<Middleware<T>> = {}
): Stored<T> {
	const middlewares = Array.isArray(options) ? options : (options.middlewares ?? []);
	const base = writable<T>();
	let state: T;
	let initialized = false;

	const get: GetState<T> = () => state;

	const setState: SetState<T> = (partial, replace = false) => {
		const candidate = isStateUpdater(partial) ? partial(state) : partial;
		const next =
			replace || !isPlainObject(state) || !isPlainObject(candidate)
				? (candidate as T)
				: ({ ...state, ...candidate } as T);

		if (Object.is(next, state)) return;

		state = next;
		if (initialized) {
			base.set(state);
		}
	};

	const api: Stored<T> = {
		subscribe: (run: Subscriber<T>, invalidate?: () => void): Unsubscriber =>
			base.subscribe(run, invalidate),
		set: (value: T) => setState(value, true),
		update: (updater: (value: T) => T) => setState(updater, true),
		get,
		setState,
		select: <Selected>(
			selector: (value: T) => Selected,
			equality: EqualityFn<Selected> = Object.is
		) => selectStore(api, selector, equality),
		readonly: () => ({ subscribe: api.subscribe })
	};

	const enhancedCreator = middlewares.reduceRight((next, middleware) => middleware(next), creator);
	state = enhancedCreator(api.setState, api.get, api);
	initialized = true;
	base.set(state);

	return api;
}

export function combine<TState extends object, TActions extends object>(
	initialState: TState,
	createActions: (set: SetState<TState & TActions>, get: GetState<TState & TActions>) => TActions
): StateCreator<TState & TActions> {
	return (set, get) => ({
		...initialState,
		...createActions(set, get)
	});
}

export function logger<T>(name = 'stored'): Middleware<T> {
	return (creator) => (set, get, api) =>
		creator(
			(partial, replace, action) => {
				const previous = get();
				set(partial, replace, action);
				const next = get();

				if (typeof console !== 'undefined') {
					console.groupCollapsed?.(`[${name}] ${action ?? 'setState'}`);
					console.log('previous', previous);
					console.log('next', next);
					console.groupEnd?.();
				}
			},
			get,
			api
		);
}

export function persist<T, Persisted = Partial<T>>(
	options: PersistOptions<T, Persisted>
): Middleware<T> {
	const serialize = options.serialize ?? JSON.stringify;
	const deserialize = options.deserialize ?? JSON.parse;
	const partialize = options.partialize ?? ((state: T) => stripFunctions(state) as Persisted);
	const merge = options.merge ?? defaultMerge<T, Persisted>;

	return (creator) => (set, get, api) => {
		const storage = options.storage ?? getDefaultStorage();

		const persistState = () => {
			if (!storage) return;

			try {
				void storage.setItem(options.name, serialize(partialize(get())));
			} catch (error) {
				options.onPersistError?.(error);
			}
		};

		const persistSet: SetState<T> = (partial, replace, action) => {
			set(partial, replace, action);
			persistState();
		};

		let current = creator(persistSet, get, api);

		if (!storage) return current;

		try {
			const stored = storage.getItem(options.name);

			if (isPromise(stored)) {
				void stored
					.then((value) => {
						if (value === null) return;
						set(merge(deserialize(value), get()), true, 'persist/rehydrate');
						options.onRehydrateStorage?.(get());
					})
					.catch(options.onPersistError);
			} else if (stored !== null) {
				current = merge(deserialize(stored), current);
				options.onRehydrateStorage?.(current);
			}
		} catch (error) {
			options.onPersistError?.(error);
		}

		return current;
	};
}

function selectStore<T, Selected>(
	store: Readable<T>,
	selector: (state: T) => Selected,
	equality: EqualityFn<Selected>
): Readable<Selected> {
	let previous: Selected;
	let hasPrevious = false;

	return derived(
		store,
		($state, set) => {
			const selected = selector($state);

			if (!hasPrevious || !equality(previous, selected)) {
				previous = selected;
				hasPrevious = true;
				set(selected);
			}
		},
		selector((store as Stored<T>).get())
	);
}

function defaultMerge<T, Persisted>(persisted: Persisted, current: T): T {
	return isPlainObject(current) && isPlainObject(persisted)
		? ({ ...current, ...persisted } as T)
		: (persisted as unknown as T);
}

function getDefaultStorage(): PersistStorage | undefined {
	return typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage;
}

function isStateUpdater<T>(value: PartialState<T>): value is StateUpdater<T> {
	return typeof value === 'function';
}

function isPlainObject(value: unknown): value is Record<PropertyKey, unknown> {
	if (value === null || typeof value !== 'object') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === objectPrototype || prototype === null;
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
	return typeof value === 'object' && value !== null && 'then' in value;
}

function stripFunctions<T>(value: T): unknown {
	if (Array.isArray(value)) return value.map(stripFunctions);
	if (!isPlainObject(value)) return typeof value === 'function' ? undefined : value;

	return Object.fromEntries(
		Object.entries(value)
			.filter(([, entry]) => typeof entry !== 'function')
			.map(([key, entry]) => [key, stripFunctions(entry)])
	);
}
