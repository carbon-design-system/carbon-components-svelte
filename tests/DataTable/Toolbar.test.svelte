<script lang="ts">
  import { Toolbar, ToolbarContent } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent: "Toolbar" | "ToolbarContent" = "Toolbar";
  export let size: ComponentProps<Toolbar>["size"] = "default";
  export let slotContent = "";
</script>

{#if testComponent === "Toolbar"}
  <Toolbar {size} {...$$restProps}>
    {#if slotContent}{slotContent}{/if}
    <slot />
  </Toolbar>
{:else if testComponent === "ToolbarContent"}
  <ToolbarContent {...$$restProps}>
    {#if slotContent}{slotContent}{/if}
    <slot />
  </ToolbarContent>
{/if}
