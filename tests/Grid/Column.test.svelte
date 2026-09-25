<script lang="ts">
  import Column from "carbon-components-svelte/Grid/Column.svelte";
  import type { ComponentProps } from "svelte";

  export let aspectRatio: ComponentProps<Column>["aspectRatio"] = undefined;
</script>

<Column {aspectRatio} data-testid="test-col">Column content</Column>
