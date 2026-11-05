<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<Button>["kind"] = "ghost";
  export let isSelected: boolean | undefined = undefined;
</script>

<Button
  data-testid="button"
  {kind}
  {isSelected}
  icon={Add}
  iconDescription="Pin"
/>
