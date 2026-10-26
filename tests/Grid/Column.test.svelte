<script lang="ts">
  import Column from "carbon-components-svelte/Grid/Column.svelte";
</script>

<Column {...$$restProps} data-testid="test-col">Column content</Column>

<!-- Type-check fixture: a span-only descriptor (no `offset` key) must be
     assignable to `sm`, confirming `offset` is optional in the generated types. -->
<Column sm={{ span: 4 }} data-testid="test-col-span-only">Column content</Column
>
