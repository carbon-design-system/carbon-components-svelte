<script lang="ts">
  import QueryBuilder from "carbon-components-svelte/QueryBuilder/QueryBuilder.svelte";
</script>

<QueryBuilder id="qb" fields={[{ id: "name", text: "Name", kind: "text" }]}>
  <svelte:fragment slot="labelChildren">
    Account <strong>filter</strong>
  </svelte:fragment>
</QueryBuilder>
