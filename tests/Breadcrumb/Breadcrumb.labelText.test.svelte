<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
</script>

<Breadcrumb labelText="Page navigation">
  <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/reports" isCurrentPage>Reports</BreadcrumbItem>
</Breadcrumb>
