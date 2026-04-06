<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<OverflowMenu>["size"] = undefined;
  export let light: ComponentProps<OverflowMenu>["light"] = false;
  export let flipped: ComponentProps<OverflowMenu>["flipped"] = false;
  export let direction: ComponentProps<OverflowMenu>["direction"] = "bottom";
  export let menuOptionsClass: ComponentProps<OverflowMenu>["menuOptionsClass"] =
    undefined;
  export let iconClass: ComponentProps<OverflowMenu>["iconClass"] = undefined;
  export let iconDescription: ComponentProps<OverflowMenu>["iconDescription"] =
    "Open and close list of options";
  export let id: ComponentProps<OverflowMenu>["id"] = `ccs-${Math.random().toString(36)}`;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = false;
  export let ariaLabel: ComponentProps<OverflowMenu>["aria-label"] = undefined;
</script>

<OverflowMenu
  aria-label={ariaLabel}
  {size}
  {light}
  {flipped}
  {direction}
  {menuOptionsClass}
  {iconClass}
  {iconDescription}
  {id}
  {portalMenu}
  on:close={(e) => {
    console.log("close", e.detail); // { index: number; text: string; }
  }}
>
  <OverflowMenuItem
    text="Manage credentials"
    on:click={() => {
      console.log("click", "Manage credentials");
    }}
  />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    target="_blank"
    text="API documentation"
    on:click={() => {
      console.log("click", "API documentation");
    }}
  />
  <OverflowMenuItem
    danger
    text="Delete service"
    on:click={() => {
      console.log("click", "Delete service");
    }}
  />
</OverflowMenu>
