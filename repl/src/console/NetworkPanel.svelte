<script>
  /** fetch/XHR requests made by the preview (sandbox/inspect/network.js). */
  import Tag from "carbon-components-svelte/src/Tag/Tag.svelte";
  import { network } from "./store.js";
  import ValueTree from "./ValueTree.svelte";

  /** @type {string} */
  export let filter = "";

  $: q = filter.trim().toLowerCase();
  $: items = [...$network]
    .reverse()
    .filter(
      (r) =>
        !q ||
        r.url.toLowerCase().includes(q) ||
        r.method.toLowerCase().includes(q),
    );

  function statusType(r) {
    if (r.error) return "red";
    if (!r.done) return "gray";
    if (r.status >= 400) return "red";
    if (r.status >= 300) return "warm-gray";
    return "green";
  }

  function size(n) {
    if (n === undefined) return "";
    return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`;
  }

  function path(url) {
    try {
      const u = new URL(url);
      return `${u.host}${u.pathname}${u.search}`;
    } catch {
      return url;
    }
  }
</script>

<div class="list">
  {#each items as r (r.id)}
    <div class="row">
      <Tag size="sm" type={statusType(r)}
        >{r.error ? "failed" : r.done ? r.status : "…"}</Tag
      >
      <span class="method">{r.method}</span>
      <span class="url" title={r.url}>{path(r.url)}</span>
      <span class="meta">
        {#if r.done || r.error}
          {Math.round(r.duration)}
          ms
        {/if}
        {#if r.size !== undefined}
          · {size(r.size)}
        {/if}
        · {r.kind}
      </span>
      {#if r.error}
        <span class="detail error"
          >{r.error}. A cross-origin API must allow the preview's origin (it
          sends Origin: null).</span
        >
      {/if}
      {#if r.request}
        <span class="detail"
          ><ValueTree name="request" value={r.request} /></span
        >
      {/if}
      {#if r.response}
        <span class="detail"
          ><ValueTree name="response" value={r.response} /></span
        >
      {/if}
    </div>
  {:else}
    <p class="empty">
      fetch and XMLHttpRequest calls from the preview appear here.
    </p>
  {/each}
</div>

<style>
  .list {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .row {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    gap: 0.125rem 0.5rem;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
    font:
      0.75rem / 1.25rem "IBM Plex Mono",
      ui-monospace,
      monospace;
  }

  .method {
    font-weight: 600;
  }

  .url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    color: var(--cds-text-02, #525252);
    white-space: nowrap;
  }

  .detail {
    grid-column: 2 / -1;
  }

  .error {
    color: var(--cds-text-error, #da1e28);
  }

  .empty {
    margin: 0;
    padding: 0.5rem 0.75rem;
    font:
      0.75rem / 1.4 "IBM Plex Mono",
      ui-monospace,
      monospace;
    color: var(--cds-text-02, #525252);
  }
</style>
