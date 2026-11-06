<script>
  import { createSelection, TextInput } from "carbon-components-svelte";

  const items = Array.from({ length: 12 }, (_, i) => ({
    id: `file-${i + 1}`,
    name: `report-${i + 1}.csv`,
  }));

  let query = "";
  let list;

  $: shown = items.filter((item) => item.name.includes(query));

  const selection = createSelection({
    keys: items,
    getKey: (item) => item.id,
    // Selections a filter hides stay selected. Use "drop" to forget them.
    hidden: "keep",
  });

  // Tell the model the order changed, so a Shift range follows what is shown.
  $: selection.setKeys(shown);

  // The summary reads the order too, so it re-runs when either changes.
  $: summary = ($selection, shown, selection.summary());

  function onKeydown(event) {
    const focus = selection.onItemKeydown(event);
    if (focus !== null) {
      list.querySelector(`[data-key="${focus}"]`)?.focus();
    }
  }
</script>

<TextInput labelText="Filter" bind:value={query} />

<p>
  {summary.count} of {summary.total} shown selected, {summary.hidden} hidden by the
  filter. Select all: {summary.state}.
</p>

<div
  bind:this={list}
  role="listbox"
  aria-label="Files"
  aria-multiselectable="true"
  tabindex="-1"
>
  {#each shown as item (item.id)}
    {@const selected = $selection.selected.has(item.id)}
    <div
      class="bx--tile bx--tile--selectable"
      class:bx--tile--is-selected={selected}
      role="option"
      data-key={item.id}
      aria-selected={selected}
      tabindex={($selection.focus ?? shown[0]?.id) === item.id ? 0 : -1}
      on:click={(event) => selection.onItemClick(event, item.id)}
      on:keydown={onKeydown}
      on:focus={() => selection.onItemFocus(item.id)}
    >
      {item.name}
    </div>
  {/each}
</div>
