<script>
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";
</script>

<Breadcrumb separator={ChevronRight} noTrailingSlash>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/reports">Reports</BreadcrumbItem>
  <BreadcrumbItem href="/reports/2019" isCurrentPage>2019</BreadcrumbItem>
</Breadcrumb>

<Breadcrumb separator={ChevronRight} size="sm" noTrailingSlash>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/reports">Reports</BreadcrumbItem>
  <BreadcrumbItem href="/reports/2019" isCurrentPage>2019</BreadcrumbItem>
</Breadcrumb>
