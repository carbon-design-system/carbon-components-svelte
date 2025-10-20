<script lang="ts">
  import {
    Toolbar,
    ToolbarContent,
    ToolbarBatchActions,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent:
    | "Toolbar"
    | "ToolbarContent"
    | "ToolbarBatchActions" = "Toolbar";
  export let size: ComponentProps<Toolbar>["size"] = "default";
  export let slotContent = "";
  export let selectedIds: ReadonlyArray<any> = [];
  export let active: boolean | undefined = undefined;
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
{:else if testComponent === "ToolbarBatchActions"}
  <Toolbar>
    <ToolbarBatchActions {selectedIds} {active} on:cancel {...$$restProps}>
      {#if slotContent}{slotContent}{/if}
      <slot />
    </ToolbarBatchActions>
  </Toolbar>
{/if}
