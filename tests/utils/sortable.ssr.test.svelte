<script lang="ts">
  import { sortableTree } from "../../src/utils/sortable-tree.js";
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

<ul role="tree" aria-label="Tree" use:sortableTree={{}}>
  {#each items as item (item)}
    <li role="treeitem" aria-selected="false" data-tree-row-id={item}>
      <div class="bx--tree-node__label">{item}</div>
    </li>
  {/each}
</ul>
