<script lang="ts">
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";
</script>

<Breadcrumb>
  <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/reports">Annual reports</BreadcrumbItem>
  <BreadcrumbItem href="/reports/2019" isCurrentPage aria-current="page">
    2019
  </BreadcrumbItem>
</Breadcrumb>
