<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarMenu from "carbon-components-svelte/DataTable/ToolbarMenu.svelte";
  import ToolbarMenuItem from "carbon-components-svelte/DataTable/ToolbarMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent: "ToolbarMenu" | "ToolbarMenuItem" = "ToolbarMenu";
  export let menuProps: ComponentProps<ToolbarMenu> = {};
  export let slotContent = "";
</script>

{#if testComponent === "ToolbarMenu"}
  <Toolbar>
    <ToolbarMenu {...menuProps} {...$$restProps}>
      {#if slotContent}
        {slotContent}
      {/if}
      <slot />
    </ToolbarMenu>
  </Toolbar>
{:else if testComponent === "ToolbarMenuItem"}
  <Toolbar>
    <ToolbarMenu>
      <ToolbarMenuItem
        on:click={() => console.log("click")}
        on:keydown={() => console.log("keydown")}
        {...$$restProps}
      >
        {#if slotContent}
          {slotContent}
        {/if}
        <slot />
      </ToolbarMenuItem>
    </ToolbarMenu>
  </Toolbar>
{/if}
