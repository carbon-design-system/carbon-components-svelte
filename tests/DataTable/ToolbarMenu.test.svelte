<script lang="ts">
  import Toolbar from "carbon-components-svelte/DataTable/Toolbar.svelte";
  import ToolbarMenu from "carbon-components-svelte/DataTable/ToolbarMenu.svelte";
  import ToolbarMenuItem from "carbon-components-svelte/DataTable/ToolbarMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent: "ToolbarMenu" | "ToolbarMenuItem" = "ToolbarMenu";
  export let menuProps: ComponentProps<ToolbarMenu> = {};
  export let slotContent = "";
  export let showMenu = true;
  export let onevent: ((name: string) => void) | undefined = undefined;
</script>

{#if testComponent === "ToolbarMenu"}
  <Toolbar>
    {#if showMenu}
      <ToolbarMenu {...menuProps} {...$$restProps}>
        {#if slotContent}
          {slotContent}
        {/if}
        <slot />
      </ToolbarMenu>
    {/if}
  </Toolbar>
{:else if testComponent === "ToolbarMenuItem"}
  <Toolbar>
    <ToolbarMenu>
      <ToolbarMenuItem
        on:click={() => onevent?.("click")}
        on:keydown={() => onevent?.("keydown")}
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
