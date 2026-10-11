<script>
  /**
   * The preview's localStorage/sessionStorage (in-memory shims, since the
   * sandbox has an opaque origin). Values are editable; edits fire through
   * the shim like any setItem.
   */
  import Button from "carbon-components-svelte/src/Button/Button.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import { postToPreview } from "../state.js";
  import { storage } from "./store.js";

  $: areas = $storage;

  function save(area, key, event) {
    const value = event.currentTarget.value;
    postToPreview({ type: "storage-set", area, key, value });
  }
</script>

<div class="list">
  {#each areas as { area, entries } (area)}
    <div class="area">
      <span class="name">{area}</span>
      <span class="count"
        >{entries.length} {entries.length === 1 ? "key" : "keys"}</span
      >
      {#if entries.length}
        <Button
          kind="ghost"
          size="small"
          on:click={() => postToPreview({ type: "storage-clear", area })}
          >Clear</Button
        >
      {/if}
    </div>
    {#each entries as [key, value] (key)}
      <div class="row">
        <span class="key" title={key}>{key}</span>
        <input
          class="value"
          aria-label="Value of {key}"
          {value}
          on:change={(e) => save(area, key, e)}
        >
        <Button
          kind="ghost"
          size="small"
          icon={TrashCan}
          iconDescription="Remove {key}"
          tooltipAlignment="end"
          on:click={() => postToPreview({ type: "storage-remove", area, key })}
        />
      </div>
    {/each}
  {:else}
    <p class="empty">
      Nothing stored yet. localStorage and sessionStorage writes from the
      preview appear here.
    </p>
  {/each}
</div>

<style>
  .list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    font:
      0.75rem / 1.25rem "IBM Plex Mono",
      ui-monospace,
      monospace;
  }

  .area {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.125rem 0.5rem;
    background: var(--cds-ui-01, #f4f4f4);
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
  }

  .name {
    font-weight: 600;
  }

  .count {
    flex: 1;
    color: var(--cds-text-02, #525252);
  }

  .row {
    display: grid;
    grid-template-columns: minmax(6rem, 30%) 1fr auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0 0.5rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
  }

  .key {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--cds-syntax-property-name, #9f1853);
  }

  .value {
    min-width: 0;
    padding: 0.125rem 0.25rem;
    border: 1px solid transparent;
    font: inherit;
    background: transparent;
    color: var(--cds-text-01, #161616);
  }

  .value:hover {
    border-color: var(--cds-ui-04, #8d8d8d);
  }

  .value:focus {
    outline: 2px solid var(--cds-focus, #0f62fe);
    outline-offset: -2px;
  }

  .empty {
    margin: 0;
    padding: 0.5rem 0.75rem;
    color: var(--cds-text-02, #525252);
  }
</style>
