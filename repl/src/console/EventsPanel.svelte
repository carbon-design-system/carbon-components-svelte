<script>
  /**
   * Carbon event log: every event a carbon-components-svelte component
   * dispatches in the preview, with its detail and the event's documentation.
   */
  import CopyButton from "carbon-components-svelte/src/CopyButton/CopyButton.svelte";
  import Tag from "carbon-components-svelte/src/Tag/Tag.svelte";
  import VirtualList from "carbon-components-svelte/src/VirtualList/VirtualList.svelte";
  import { tick } from "svelte";
  import { componentApi } from "../state.js";
  import { events } from "./store.js";
  import ValueTree from "./ValueTree.svelte";

  /** @type {string} */
  export let filter = "";

  let listHeight = 200;
  /** @type {null | HTMLDivElement} */
  let listRef = null;

  $: api = $componentApi;
  $: q = filter.trim().toLowerCase();
  $: items = $events.filter(
    (e) =>
      !q ||
      e.component.toLowerCase().includes(q) ||
      e.eventType.toLowerCase().includes(q),
  );
  $: if (items) followTail();

  async function followTail() {
    await tick();
    requestAnimationFrame(() => {
      if (listRef) listRef.scrollTop = listRef.scrollHeight;
    });
  }

  function describe(e) {
    const event = api?.components?.[e.component]?.events?.find(
      (x) => x.name === e.eventType,
    );
    return event;
  }

  function handler(e) {
    return `on:${e.eventType}={(e) => console.log(e.detail)}`;
  }
</script>

<div class="list" bind:clientHeight={listHeight}>
  {#if items.length}
    <VirtualList
      bind:ref={listRef}
      {items}
      measured
      itemHeight={28}
      containerHeight={listHeight}
      getKey={(e) => e.id}
      let:item
    >
      {@const doc = describe(item)}
      <div class="row">
        <Tag size="sm" type="cool-gray">{item.component}</Tag>
        <span class="type">{item.eventType}</span>
        {#if item.cancelled}
          <Tag size="sm" type="warm-gray">cancelled</Tag>
        {/if}
        <span class="detail"><ValueTree value={item.args[0]} /></span>
        <span class="actions">
          <CopyButton
            text={handler(item)}
            iconDescription="Copy handler"
            feedback="Handler copied"
          />
        </span>
        {#if doc?.description || doc?.detail}
          <p class="doc">
            {#if doc.description}
              {doc.description}
            {/if}
            {#if doc.detail}
              <code>detail: {doc.detail}</code>
            {/if}
          </p>
        {/if}
      </div>
    </VirtualList>
  {:else}
    <p class="empty">
      Events dispatched by Carbon components in the preview appear here.
    </p>
  {/if}
</div>

<style>
  .list {
    flex: 1;
    min-height: 0;
  }

  .row {
    display: grid;
    grid-template-columns: auto auto auto 1fr auto;
    align-items: center;
    gap: 0.25rem 0.5rem;
    padding: 0.25rem 0.5rem;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
    font:
      0.75rem / 1.25rem "IBM Plex Mono",
      ui-monospace,
      monospace;
  }

  .type {
    font-weight: 600;
  }

  .detail {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .actions {
    justify-self: end;
  }

  .doc {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 0.75rem;
    line-height: 1rem;
    color: var(--cds-text-02, #525252);
  }

  .doc code {
    margin-left: 0.5rem;
    font-size: 0.75rem;
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
