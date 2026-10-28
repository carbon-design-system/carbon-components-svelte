<script lang="ts">
  import Kanban from "carbon-components-svelte/Kanban/Kanban.svelte";
  import type { ComponentProps } from "svelte";

  type Item = { id: string; column: string; title: string };

  export let bound = true;
  export let limitMode: ComponentProps<Kanban>["limitMode"] = "warn";
  export let collapsible = false;
  export let disabled = false;
  export let refuse = false;
  export let onMove: (detail: unknown) => void = () => {};

  const columns = [
    { id: "todo", title: "To do", limit: 3 },
    { id: "doing", title: "Doing", limit: 1 },
    { id: "done", title: "Done" },
  ];
  const initial: Item[] = [
    { id: "a", column: "todo", title: "Alpha" },
    { id: "b", column: "todo", title: "Bravo" },
    { id: "c", column: "doing", title: "Charlie" },
    { id: "d", column: "done", title: "Delta" },
  ];

  // The consumer's own array, to see whether the board writes to it.
  let items: Item[] = initial.slice();
  let collapsedColumns: string[] = [];
  const snapshot = (list: Item[]) =>
    columns
      .map(
        (column) =>
          `${column.id}:${list
            .filter((item) => item.column === column.id)
            .map((item) => item.id)
            .join("")}`,
      )
      .join(" ");
</script>

{#if bound}
  <Kanban
    aria-label="Board"
    {columns}
    bind:items
    bind:collapsedColumns
    {limitMode}
    {collapsible}
    {disabled}
    on:move={(event) => {
      onMove(event.detail);
      if (refuse) event.preventDefault();
    }}
  />
{:else}
  <Kanban
    aria-label="Board"
    {columns}
    {items}
    {limitMode}
    {collapsible}
    {disabled}
    on:move={(event) => {
      onMove(event.detail);
      if (refuse) event.preventDefault();
    }}
  />
{/if}
<div data-testid="consumer">{snapshot(items)}</div>
<div data-testid="collapsed">{collapsedColumns.join(",")}</div>
