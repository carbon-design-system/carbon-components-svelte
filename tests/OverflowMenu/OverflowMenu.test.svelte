<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  export let size: "sm" | "xl" | undefined = undefined;
  export let light: boolean = false;
  export let flipped: boolean = false;
  export let direction: "top" | "bottom" = "bottom";
  export let menuOptionsClass: string | undefined = undefined;
  export let iconClass: string | undefined = undefined;
  export let iconDescription: string = "Open and close list of options";
  export let id: string = `ccs-${Math.random().toString(36)}`;
  export let portalMenu: boolean = false;
  export let ariaLabel: string | undefined = undefined;
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
