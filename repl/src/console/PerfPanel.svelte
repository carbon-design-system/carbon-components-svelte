<script>
  /**
   * Performance channel: the latest run's summary, slow interactions (Event
   * Timing, with the DOM mutations each caused) and long animation frames with
   * scripts mapped to REPL lines.
   */
  import Tag from "carbon-components-svelte/src/Tag/Tag.svelte";
  import { devMode, jumpTo, postToPreview } from "../state.js";
  import {
    perfFrames,
    perfHotspots,
    perfInteractions,
    perfRuns,
  } from "./store.js";
  import ValueTree from "./ValueTree.svelte";

  const ms = (v) => `${Math.round(v)} ms`;

  $: run = $perfRuns.at(-1);
  $: interactions = [...$perfInteractions].reverse();
  $: frames = [...$perfFrames].reverse();
  $: hot = $perfHotspots;
  $: dev = $devMode;
  $: maxHot = hot[0]?.count ?? 1;
  $: worst = $perfInteractions.reduce((m, i) => Math.max(m, i.duration), 0);

  function sourceLabel(source) {
    if (!source) return "";
    return source.line ? `${source.file}:${source.line}` : source.file;
  }
</script>

<div class="perf">
  {#if run}
    <section class="summary" aria-label="Last run">
      <span
        ><strong>Run</strong>
        import {ms(run.importMs)} · mount {ms(run.mountMs)} · painted
        {ms(run.paintMs)}</span
      >
      <span
        >{run.domNodes.toLocaleString()}
        DOM nodes · {run.userModules} REPL modules ·
        {run.libraryModules}
        library modules loaded</span
      >
      {#if worst}
        <Tag
          size="sm"
          type={worst > 200 ? "red" : worst > 100 ? "warm-gray" : "green"}
          >slowest interaction {ms(worst)}</Tag
        >
      {/if}
    </section>
  {/if}

  <h3>Slow interactions <span class="hint">over 16 ms, newest first</span></h3>
  {#each interactions as item, i (i)}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="row"
      on:mouseenter={() =>
        item.target && postToPreview({ type: "highlight", id: item.target.id })}
      on:mouseleave={() => postToPreview({ type: "unhighlight" })}
    >
      <Tag
        size="sm"
        type={item.duration > 200
          ? "red"
          : item.duration > 100
            ? "warm-gray"
            : "cool-gray"}
        >{ms(item.duration)}</Tag
      >
      <span class="type">{item.type}</span>
      <span class="phases"
        >delay {ms(item.inputDelay)} · handlers {ms(item.processing)} · render
        {ms(item.presentation)}
        · {item.mutations.toLocaleString()} DOM changes</span
      >
      {#if item.source}
        <button type="button" class="link" on:click={() => jumpTo(item.source)}>
          {sourceLabel(item.source)}
        </button>
      {/if}
      {#if item.target}
        <span class="target"><ValueTree value={item.target} /></span>
      {/if}
    </div>
  {:else}
    <p class="empty">
      Interact with the preview; anything slower than 16 ms shows up here.
    </p>
  {/each}

  <h3>
    DOM updates by component <span class="hint">this run, in dev mode</span>
  </h3>
  {#if !dev}
    <p class="empty">
      Turn on Dev mode to see which components cause the most DOM work.
    </p>
  {:else}
    {#each hot as h (h.source.file + h.source.line + h.source.column)}
      <div class="row hot">
        <span class="count">{h.count.toLocaleString()}</span>
        <span
          class="bar"
          style:width="{Math.max(2, (h.count / maxHot) * 100)}%"
        ></span>
        <button type="button" class="link" on:click={() => jumpTo(h.source)}>
          {sourceLabel(h.source)}
        </button>
        <span class="muted">{h.source.tag ? `<${h.source.tag}>` : ""}</span>
      </div>
    {:else}
      <p class="empty">No DOM updates yet.</p>
    {/each}
  {/if}

  <h3>
    Long tasks
    <span class="hint">50 ms or more; sampled attribution in Chromium</span>
  </h3>
  {#each frames as frame, i (i)}
    <div class="row">
      <Tag size="sm" type={frame.duration > 200 ? "red" : "warm-gray"}
        >{ms(frame.duration)}</Tag
      >
      <span class="type">long task</span>
      <ul class="scripts">
        {#each frame.scripts as script}
          <li>
            ~{ms(script.duration)}
            in
            {#if script.source.kind === "user" && script.source.line}
              <button
                type="button"
                class="link"
                on:click={() => jumpTo(script.source)}
              >
                {sourceLabel(script.source)}
              </button>
            {:else}
              <span class:muted={script.source.kind !== "user"}
                >{sourceLabel(script.source)}</span
              >
            {/if}
            {#if script.fn}
              <span class="muted">({script.fn})</span>
            {/if}
          </li>
        {:else}
          <li class="muted">
            No samples in REPL or library code (rendering, layout or the Svelte
            runtime)
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="empty">No long tasks.</p>
  {/each}
</div>

<style>
  .perf {
    flex: 1;
    min-height: 0;
    overflow: auto;
    font-size: 0.75rem;
    line-height: 1.25rem;
  }

  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 1rem;
    padding: 0.5rem;
    background: var(--cds-ui-01, #f4f4f4);
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
  }

  h3 {
    margin: 0;
    padding: 0.5rem 0.5rem 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .hint,
  .muted {
    font-weight: 400;
    color: var(--cds-text-02, #525252);
  }

  .row {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    gap: 0.125rem 0.5rem;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
  }

  .type {
    font-weight: 600;
  }

  .hot {
    grid-template-columns: 4rem 6rem auto 1fr;
  }

  .count {
    text-align: right;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
  }

  .bar {
    height: 0.5rem;
    background: var(--cds-interactive-01, #0f62fe);
  }

  .target,
  .scripts {
    grid-column: 2 / -1;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
  }

  .scripts {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .link {
    padding: 0;
    border: 0;
    font: inherit;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    color: var(--cds-link-01, #0f62fe);
    text-decoration: underline;
    background: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .link:focus-visible {
    outline: 2px solid var(--cds-focus, #0f62fe);
  }

  .empty {
    margin: 0;
    padding: 0.25rem 0.5rem 0.5rem;
    color: var(--cds-text-02, #525252);
  }
</style>
