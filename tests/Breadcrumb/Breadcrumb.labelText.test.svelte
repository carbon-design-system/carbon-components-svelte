<script lang="ts">
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";
</script>

<Breadcrumb labelText="Page navigation">
  <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/reports" isCurrentPage>Reports</BreadcrumbItem>
</Breadcrumb>
