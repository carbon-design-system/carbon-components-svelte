<script lang="ts">
  import SelectionBar from "carbon-components-svelte/SelectionBar/SelectionBar.svelte";
  import type { ComponentProps } from "svelte";

  export let count = 0;
  export let placement: ComponentProps<SelectionBar>["placement"] = "content";
  export let transition: ComponentProps<SelectionBar>["transition"] = undefined;
</script>

<SelectionBar {count} {placement} {transition} data-testid="bar" />
