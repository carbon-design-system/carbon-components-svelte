<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import type { ComponentProps } from "svelte";

  export let tooltipAlignment: ComponentProps<Button>["tooltipAlignment"] =
    undefined;
  export let tooltipPosition: ComponentProps<Button>["tooltipPosition"] =
    "bottom";
</script>

{#if tooltipAlignment === undefined}
  <Button icon={Add} iconDescription="Clear console" {tooltipPosition} />
{:else}
  <Button
    icon={Add}
    iconDescription="Clear console"
    {tooltipAlignment}
    {tooltipPosition}
  />
{/if}
