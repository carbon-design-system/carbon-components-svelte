<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let autoAlign: ComponentProps<OverflowMenu>["autoAlign"] = true;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = undefined;
</script>

<OverflowMenu {autoAlign} {portalMenu}>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem text="API documentation" />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>
