<script>
  /** Accessibility findings from the preview audit (sandbox/inspect/a11y.js). */
  import Tag from "carbon-components-svelte/src/Tag/Tag.svelte";
  import { jumpTo, postToPreview } from "../state.js";
  import { a11y } from "./store.js";
  import ValueTree from "./ValueTree.svelte";

  /** @type {string} */
  export let filter = "";

  $: q = filter.trim().toLowerCase();
  $: items = $a11y.filter(
    (f) => !q || f.message.toLowerCase().includes(q) || f.rule.includes(q),
  );
</script>

<div class="list">
  {#each items as finding, i (i)}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="row"
      on:mouseenter={() =>
        postToPreview({ type: "highlight", id: finding.node.id })}
      on:mouseleave={() => postToPreview({ type: "unhighlight" })}
    >
      <Tag size="sm" type={finding.severity === "error" ? "red" : "warm-gray"}
        >{finding.rule}</Tag
      >
      <span class="message">{finding.message}</span>
      {#if finding.source}
        <button
          type="button"
          class="link"
          on:click={() => jumpTo(finding.source)}
        >
          {finding.source.file}:{finding.source.line}
        </button>
      {/if}
      <span class="node"><ValueTree value={finding.node} /></span>
    </div>
  {:else}
    <p class="empty">
      No accessibility findings. The preview is audited after each change.
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
    grid-template-columns: auto 1fr auto;
    gap: 0.125rem 0.5rem;
    align-items: center;
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
    font-size: 0.75rem;
    line-height: 1.25rem;
  }

  .node {
    grid-column: 2 / -1;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
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
    padding: 0.5rem 0.75rem;
    font:
      0.75rem / 1.4 "IBM Plex Mono",
      ui-monospace,
      monospace;
    color: var(--cds-text-02, #525252);
  }
</style>
