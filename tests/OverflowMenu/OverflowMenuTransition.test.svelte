<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = false;
  export let direction: ComponentProps<OverflowMenu>["direction"] = "bottom";
  export let menuTransition: ComponentProps<OverflowMenu>["menuTransition"] =
    undefined;
  export let onIntroStart: () => void = () => {};
  export let onIntroEnd: () => void = () => {};
  export let onOutroStart: () => void = () => {};
  export let onOutroEnd: () => void = () => {};
</script>

<OverflowMenu
  bind:open
  {portalMenu}
  {direction}
  {menuTransition}
  on:introstart={onIntroStart}
  on:introend={onIntroEnd}
  on:outrostart={onOutroStart}
  on:outroend={onOutroEnd}
>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem text="API documentation" />
</OverflowMenu>
