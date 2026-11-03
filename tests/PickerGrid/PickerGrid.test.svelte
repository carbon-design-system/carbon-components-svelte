<script lang="ts">
  import PickerGrid from "carbon-components-svelte/PickerGrid/PickerGrid.svelte";

  export let selectionMode: "single" | "multiple" = "single";
  export let selectedId: string | undefined = undefined;
  export let selectedIds: string[] = [];
  export let recent: string[] = [];
  export let query = "";
  export let searchable = true;
  export let stickyHeaders = true;

  let events: string[] = [];

  const categories = [
    { id: "fruit", label: "Fruit" },
    { id: "veg", label: "Vegetables" },
  ];
  const items = [
    { id: "apple", label: "Apple", category: "fruit" },
    { id: "banana", label: "Banana", category: "fruit", keywords: ["yellow"] },
    { id: "carrot", label: "Carrot", category: "veg" },
    { id: "leek", label: "Leek", category: "veg", disabled: true },
  ];
</script>

<PickerGrid
  {items}
  {categories}
  {selectionMode}
  {searchable}
  {stickyHeaders}
  columns={2}
  bind:selectedId
  bind:selectedIds
  bind:recent
  bind:query
  on:select={({ detail }) =>
    (events = [...events, `${detail.id}:${detail.selected}`])}
  on:recent:change
  on:highlight
>
  <svelte:fragment slot="cell" let:item let:selected>
    <span data-testid="cell-{item.id}">{item.label}{selected ? "*" : ""}</span>
  </svelte:fragment>
  <svelte:fragment slot="preview" let:item>
    <span data-testid="preview">{item.label}</span>
  </svelte:fragment>
  <svelte:fragment slot="noResults" let:query>
    <span data-testid="none">Nothing for {query}</span>
  </svelte:fragment>
</PickerGrid>
<output data-testid="selected">{selectedId ?? ""}</output>
<output data-testid="selected-ids">{selectedIds.join(",")}</output>
<output data-testid="events">{events.join(",")}</output>
<output data-testid="recent">{recent.join(",")}</output>
