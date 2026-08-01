<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let maxHeight: ComponentProps<OverflowMenu>["maxHeight"] = undefined;
  export let portalMenu: ComponentProps<OverflowMenu>["portalMenu"] = false;
</script>

<OverflowMenu {maxHeight} {portalMenu}>
  <OverflowMenuItem text="Manage credentials" />
  <OverflowMenuItem
    href="https://cloud.ibm.com/docs/api-gateway/"
    target="_blank"
    text="API documentation"
  />
  <OverflowMenuItem danger text="Delete service" />
</OverflowMenu>
