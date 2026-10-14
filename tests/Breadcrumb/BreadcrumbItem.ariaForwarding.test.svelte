<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";

  export let href = "/reports";
  export let itemProps: Record<string, unknown> = {};
</script>

<span id="extra-help">Extra help</span>
<span id="external-name">External name</span>
<Breadcrumb>
  <BreadcrumbItem {href} data-testid="item" {...itemProps}>
    Reports
  </BreadcrumbItem>
</Breadcrumb>
