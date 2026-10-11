<script>
  import Button from "carbon-components-svelte/src/Button/Button.svelte";
  import ContentSwitcher from "carbon-components-svelte/src/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/src/ContentSwitcher/Switch.svelte";
  import MultiSelect from "carbon-components-svelte/src/MultiSelect/MultiSelect.svelte";
  import Search from "carbon-components-svelte/src/Search/Search.svelte";
  import Tag from "carbon-components-svelte/src/Tag/Tag.svelte";
  import Toggle from "carbon-components-svelte/src/Toggle/Toggle.svelte";
  import VirtualList from "carbon-components-svelte/src/VirtualList/VirtualList.svelte";
  import Clean from "carbon-icons-svelte/lib/Clean.svelte";
  import { tick } from "svelte";
  import EvalInput from "./EvalInput.svelte";
  import EventsPanel from "./EventsPanel.svelte";
  import LogRow from "./LogRow.svelte";
  import {
    clearConsole,
    clearEvents,
    counts,
    events,
    LEVELS,
    levels,
    preserve,
    query,
    visible,
  } from "./store.js";

  const levelItems = LEVELS.map((id) => ({
    id,
    text: id === "log" ? "Log" : id[0].toUpperCase() + id.slice(1),
  }));

  let selectedLevels = [...LEVELS];
  let tab = 0;
  let preserveLog = false;
  let filter = "";
  let listHeight = 200;
  /** @type {null | HTMLDivElement} */
  let listRef = null;
  let stick = true;

  $: levels.set(new Set(selectedLevels));
  $: preserve.set(preserveLog);
  $: query.set(filter);
  $: items = $visible;
  $: c = $counts;
  $: eventCount = $events.length;
  $: if (items) followTail();

  let autoScrolling = false;

  async function followTail() {
    if (!stick || !listRef) return;
    await tick();
    requestAnimationFrame(() => {
      if (!listRef || !stick) return;
      autoScrolling = true;
      listRef.scrollTop = listRef.scrollHeight;
    });
  }

  /** @type {null | HTMLDivElement} */
  let watched = null;

  function onScroll() {
    // Our own scroll-to-bottom can land short while rows are still being
    // measured; only a user scroll turns following off.
    if (autoScrolling) {
      autoScrolling = false;
      return;
    }
    stick =
      listRef.scrollTop + listRef.clientHeight >= listRef.scrollHeight - 8;
  }

  // The list (and its ref) only exists while there are entries.
  $: if (listRef !== watched) {
    watched?.removeEventListener("scroll", onScroll);
    listRef?.addEventListener("scroll", onScroll, { passive: true });
    watched = listRef;
    stick = true;
  }
</script>

<div class="console">
  <div class="bar">
    <ContentSwitcher size="sm" autoWidth bind:selectedIndex={tab}>
      <Switch text="Console" />
      <Switch text="Events{eventCount ? ` (${eventCount})` : ""}" />
    </ContentSwitcher>
    {#if c.error}
      <Tag size="sm" type="red">{c.error} errors</Tag>
    {/if}
    {#if c.warn}
      <Tag size="sm" type="warm-gray">{c.warn} warnings</Tag>
    {/if}
    <div class="search">
      <Search
        size="sm"
        placeholder="Filter"
        labelText="Filter console"
        bind:value={filter}
      />
    </div>
    <div class="levels" class:hidden={tab === 1}>
      <MultiSelect
        type="inline"
        size="sm"
        titleText="Levels"
        label="Levels"
        items={levelItems}
        bind:selectedIds={selectedLevels}
      />
    </div>
    <div class="preserve" title="Preserve log across runs">
      <Toggle
        size="sm"
        labelText="Preserve log"
        hideLabel
        labelA=""
        labelB=""
        bind:toggled={preserveLog}
      />
    </div>
    <Button
      kind="ghost"
      size="small"
      icon={Clean}
      iconDescription="Clear console"
      tooltipAlignment="end"
      on:click={() => (tab === 0 ? clearConsole() : clearEvents())}
    />
  </div>

  {#if tab === 0}
    <div class="list" bind:clientHeight={listHeight}>
      {#if items.length}
        <VirtualList
          bind:ref={listRef}
          {items}
          measured
          itemHeight={28}
          containerHeight={listHeight}
          getKey={(entry) => entry.id}
          let:item
        >
          <LogRow entry={item} />
        </VirtualList>
      {:else}
        <p class="empty">Console output from the preview appears here.</p>
      {/if}
    </div>

    <EvalInput />
  {:else}
    <EventsPanel {filter} />
  {/if}
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
    gap: 0.25rem 0.5rem;
    min-height: 2.5rem;
    padding-left: 0.75rem;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--cds-ui-03, #e0e0e0);
    overflow-x: auto;
  }

  .bar > :global(.bx--form-item) {
    flex: none;
  }

  .hidden {
    display: none;
  }

  .preserve {
    flex: none;
  }

  .search {
    flex: 1;
    min-width: 6rem;
    max-width: 14rem;
    margin-left: auto;
  }

  .levels {
    flex: none;
  }

  .list {
    flex: 1;
    min-height: 0;
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
