<script lang="ts">
  import type { SortDetail } from "../../src/utils/sortable-model.js";
  import { applySort } from "../../src/utils/sortable-model.js";
  import { sortable } from "../../src/utils/sortable.js";

  export let veto = false;

  let items = ["Alpha", "Bravo", "Charlie"].map((text) => ({
    id: text.toLowerCase(),
    text,
  }));

  function handleSort(event: CustomEvent<SortDetail>) {
    if (veto) {
      event.preventDefault();
      return;
    }
    items = applySort(items, event.detail);
  }
</script>

<ul
  aria-label="Letters"
  use:sortable={{ handleSelector: "button" }}
  on:sort={handleSort}
>
  {#each items as item (item.id)}
    <li data-sortable-id={item.id}>
      <button type="button" aria-label="Move {item.text}">grip</button>
      <span>{item.text}</span>
    </li>
  {/each}
</ul>
