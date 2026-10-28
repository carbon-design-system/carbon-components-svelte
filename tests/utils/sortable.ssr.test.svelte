<script lang="ts">
  import { sortable } from "../../src/utils/sortable.js";

  const items = ["Alpha", "Bravo", "Charlie"];
</script>

<ul aria-label="Letters" use:sortable={{ handleSelector: "button" }}>
  {#each items as item (item)}
    <li data-sortable-id={item}>
      <button type="button" aria-label="Reorder {item}">&#x2807;</button>
      {item}
    </li>
  {/each}
</ul>
