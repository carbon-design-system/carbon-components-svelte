<script lang="ts">
  import {
    Toolbar,
    ToolbarBatchActions,
    ToolbarContent,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent:
    | "Toolbar"
    | "ToolbarContent"
    | "ToolbarBatchActions" = "Toolbar";
  export let size: ComponentProps<Toolbar>["size"] = "default";
  export let slotContent = "";
  export let selectedIds: ComponentProps<ToolbarBatchActions>["selectedIds"] =
    [];
  export let active: ComponentProps<ToolbarBatchActions>["active"] = undefined;
  export let oncancel: ((event: CustomEvent) => void) | undefined = undefined;
</script>

{#if testComponent === "Toolbar"}
  <Toolbar {size} {...$$restProps}>
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </Toolbar>
{:else if testComponent === "ToolbarContent"}
  <ToolbarContent>
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </ToolbarContent>
{:else if testComponent === "ToolbarBatchActions"}
  <Toolbar>
    <ToolbarBatchActions
      {selectedIds}
      {active}
      on:cancel={(e) => oncancel?.(e)}
      {...$$restProps}
    >
      {#if slotContent}
        {slotContent}
      {/if}
      <slot />
    </ToolbarBatchActions>
  </Toolbar>
{/if}
