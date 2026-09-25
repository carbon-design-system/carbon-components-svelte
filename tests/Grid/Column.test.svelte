<script lang="ts">
  import Column from "carbon-components-svelte/Grid/Column.svelte";
  import type { ComponentProps } from "svelte";

  export let aspectRatio: ComponentProps<Column>["aspectRatio"] = undefined;
  export let sm: ComponentProps<Column>["sm"] = undefined;
</script>

<Column {aspectRatio} {sm} data-testid="test-col">Column content</Column>

<!-- Type-check fixture: a span-only descriptor (no `offset` key) must be
     assignable to `sm`, confirming `offset` is optional in the generated types. -->
<Column sm={{ span: 4 }} data-testid="test-col-span-only"
  >Column content</Column
>
