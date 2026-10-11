<script>
  import Button from "carbon-components-svelte/src/Button/Button.svelte";
  import Clean from "carbon-icons-svelte/lib/Clean.svelte";
  import { afterUpdate } from "svelte";
  import { logs } from "./state.js";

  /** @type {HTMLOListElement} */
  let list;
  let stick = true;

  afterUpdate(() => {
    if (stick && list) list.scrollTop = list.scrollHeight;
  });

  function onScroll() {
    stick = list.scrollTop + list.clientHeight >= list.scrollHeight - 4;
  }
</script>

<div class="console">
  <div class="bar">
    <span class="title">Console</span>
    <span class="count">{$logs.length}</span>
    <Button
      kind="ghost"
      size="small"
      icon={Clean}
      iconDescription="Clear console"
      tooltipAlignment="end"
      on:click={() => logs.set([])}
    />
  </div>
  <ol bind:this={list} on:scroll={onScroll}>
    {#each $logs as entry, i (i)}
      <li class={entry.level}>{entry.text}</li>
    {:else}
      <li class="empty">Console output from the preview appears here.</li>
    {/each}
  </ol>
</div>

<style>
  .console {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-left: 1rem;
    min-height: 2rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
  }

  .title {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .count {
    flex: 1;
    font-size: 0.75rem;
    color: var(--cds-text-02, #525252);
  }

  ol {
    flex: 1;
    min-height: 0;
    overflow: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    font:
      0.75rem / 1.4 "IBM Plex Mono",
      ui-monospace,
      monospace;
  }

  li {
    padding: 0.25rem 1rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .warn {
    background: #fcf4d6;
  }

  .error {
    background: #fff1f1;
    color: var(--cds-support-01, #da1e28);
  }

  .info,
  .debug {
    color: var(--cds-text-02, #525252);
  }

  .empty {
    color: var(--cds-text-02, #525252);
    border: 0;
  }
</style>
