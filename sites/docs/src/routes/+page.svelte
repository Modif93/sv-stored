<script lang="ts">
	import { createStored, logger, persist } from 'sv-stored';

	type Counter = {
		count: number;
		increment: () => void;
		decrement: () => void;
		reset: () => void;
	};

	const counter = createStored<Counter>(
		(set) => ({
			count: 0,
			increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
			decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
			reset: () => set({ count: 0 }, false, 'reset')
		}),
		{
			middlewares: [persist({ name: 'stored-docs-counter' }), logger('docs-counter')]
		}
	);

	const count = counter.select((state) => state.count);

	const install = 'pnpm add sv-stored';
	const example = `import { createStored, persist } from 'sv-stored';

export const counter = createStored(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }))
  }),
  { middlewares: [persist({ name: 'counter' })] }
);`;
</script>

<main class="shell">
	<section class="hero">
		<p class="eyebrow">Svelte Store Middleware Toolkit</p>
		<h1>Stored</h1>
		<p class="lead">
			Svelte의 store contract는 그대로 유지하면서, Zustand처럼 middleware를 조합할 수 있는 가벼운
			래퍼입니다.
		</p>

		<div class="actions">
			<a href="#quick-start">Quick start</a>
			<a class="secondary" href="https://github.com/modif93/sv-stored">GitHub</a>
		</div>
	</section>

	<section class="panel demo" aria-labelledby="demo-title">
		<div>
			<p class="eyebrow">Live store</p>
			<h2 id="demo-title">Middleware powered counter</h2>
			<p>
				이 예제는 <code>persist</code>와 <code>logger</code> middleware를 동시에 사용합니다.
			</p>
		</div>

		<div class="counter" aria-live="polite">
			<strong>{$count}</strong>
			<div class="counter-actions">
				<button onclick={() => $counter.decrement()}>-1</button>
				<button onclick={() => $counter.increment()}>+1</button>
				<button onclick={() => $counter.reset()}>Reset</button>
			</div>
		</div>
	</section>

	<section id="quick-start" class="grid">
		<article class="panel">
			<p class="eyebrow">Install</p>
			<h2>시작하기</h2>
			<pre><code>{install}</code></pre>
		</article>

		<article class="panel">
			<p class="eyebrow">API</p>
			<h2>Store + helpers</h2>
			<ul>
				<li>
					<code>subscribe</code>, <code>set</code>, <code>update</code>: Svelte store contract
				</li>
				<li><code>setState</code>: partial update와 shallow merge</li>
				<li><code>select</code>: selector 기반 readable store</li>
				<li><code>persist</code>, <code>logger</code>: 기본 middleware</li>
			</ul>
		</article>
	</section>

	<section class="panel">
		<p class="eyebrow">Example</p>
		<h2>Zustand-like creator</h2>
		<pre><code>{example}</code></pre>
	</section>
</main>

<style>
	.shell {
		width: min(1120px, calc(100% - 2rem));
		margin: 0 auto;
		padding: 5rem 0;
	}

	.hero {
		padding: 5rem 0 4rem;
	}

	.eyebrow {
		margin: 0 0 0.75rem;
		color: #6753ff;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1,
	h2,
	p {
		margin-top: 0;
	}

	h1 {
		max-width: 11ch;
		margin-bottom: 1rem;
		font-size: clamp(4rem, 16vw, 10rem);
		line-height: 0.82;
		letter-spacing: -0.1em;
	}

	h2 {
		margin-bottom: 0.75rem;
		font-size: clamp(1.75rem, 4vw, 3rem);
		line-height: 1;
		letter-spacing: -0.06em;
	}

	.lead {
		max-width: 48rem;
		color: #465169;
		font-size: clamp(1.2rem, 3vw, 1.75rem);
		line-height: 1.45;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		margin-top: 2rem;
	}

	.actions a,
	button {
		border: 0;
		border-radius: 999px;
		background: #172033;
		color: white;
		font-weight: 800;
		text-decoration: none;
		box-shadow: 0 1rem 2rem rgba(23, 32, 51, 0.18);
		cursor: pointer;
	}

	.actions a {
		padding: 0.9rem 1.2rem;
	}

	.actions .secondary,
	button {
		background: white;
		color: #172033;
	}

	.panel {
		border: 1px solid rgba(103, 83, 255, 0.14);
		border-radius: 2rem;
		padding: clamp(1.25rem, 4vw, 2rem);
		background: rgba(255, 255, 255, 0.78);
		box-shadow: 0 1.4rem 4rem rgba(60, 72, 112, 0.12);
		backdrop-filter: blur(20px);
	}

	.demo {
		display: grid;
		grid-template-columns: 1.2fr 0.8fr;
		gap: 2rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.counter {
		display: grid;
		place-items: center;
		gap: 1rem;
		border-radius: 1.5rem;
		padding: 2rem;
		background: #172033;
		color: white;
	}

	.counter strong {
		font-size: clamp(4rem, 12vw, 8rem);
		line-height: 0.9;
	}

	.counter-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.6rem;
	}

	button {
		padding: 0.75rem 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	pre {
		overflow-x: auto;
		border-radius: 1rem;
		padding: 1rem;
		background: #111827;
		color: #d7e1ff;
	}

	code {
		font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
		font-size: 0.92em;
	}

	li + li {
		margin-top: 0.5rem;
	}

	@media (max-width: 780px) {
		.demo,
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
