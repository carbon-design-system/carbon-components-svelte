<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<OverflowMenu>["size"] = undefined;
</script>

<Breadcrumb>
  <BreadcrumbItem>
    <OverflowMenu {size}>
      <OverflowMenuItem text="Data" />
      <OverflowMenuItem text="Latest" />
    </OverflowMenu>
  </BreadcrumbItem>
</Breadcrumb>
