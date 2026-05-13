<script lang="ts">
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";
</script>

<Breadcrumb size="sm">
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/settings" isCurrentPage>Settings</BreadcrumbItem>
</Breadcrumb>
