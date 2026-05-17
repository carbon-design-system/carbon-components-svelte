<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarBatchActions from "carbon-components-svelte/DataTable/ToolbarBatchActions.svelte";
  import ToolbarContent from "carbon-components-svelte/DataTable/ToolbarContent.svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent:
    | "Toolbar"
    | "ToolbarContent"
    | "ToolbarBatchActions" = "Toolbar";
  export let size: ComponentProps<Toolbar>["size"] = "default";
  export let ariaLabel: ComponentProps<Toolbar>["ariaLabel"] = undefined;
  export let slotContent = "";
  export let selectedIds: ComponentProps<ToolbarBatchActions>["selectedIds"] =
    [];
  export let active: ComponentProps<ToolbarBatchActions>["active"] = undefined;
  export let oncancel: ((event: CustomEvent) => void) | undefined = undefined;
</script>

{#if testComponent === "Toolbar"}
  <Toolbar {size} {ariaLabel} {...$$restProps}>
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
