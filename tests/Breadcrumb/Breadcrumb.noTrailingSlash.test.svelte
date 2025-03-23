<script lang="ts">
import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";
</script>

<Breadcrumb noTrailingSlash>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/profile" isCurrentPage>Profile</BreadcrumbItem>
</Breadcrumb>
