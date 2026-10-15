<script lang="ts">
  import TableHeader from "carbon-components-svelte/DataTable/TableHeader.svelte";

  export let sortable = false;
</script>

<table>
  <thead>
    <tr>
      <TableHeader {sortable} {...$$restProps}>Name</TableHeader>
    </tr>
  </thead>
</table>
