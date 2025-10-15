<script lang="ts">
  import {
    Toolbar,
    ToolbarMenu,
    ToolbarMenuItem,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent: "ToolbarMenu" | "ToolbarMenuItem" = "ToolbarMenu";
  export let menuProps: ComponentProps<ToolbarMenu> = {};
  export let slotContent = "";
</script>

{#if testComponent === "ToolbarMenu"}
  <Toolbar>
    <ToolbarMenu {...menuProps} {...$$restProps}>
      {#if slotContent}{slotContent}{/if}
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
        {#if slotContent}{slotContent}{/if}
        <slot />
      </ToolbarMenuItem>
    </ToolbarMenu>
  </Toolbar>
{/if}
