<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";

  /** Attributes for the `Breadcrumb` itself. */
  export let nav: Record<string, unknown> = {};
</script>

<Breadcrumb {...nav}>
  <BreadcrumbItem href="/reports" {...$$restProps}>Reports</BreadcrumbItem>
</Breadcrumb>
