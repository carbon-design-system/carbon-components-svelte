<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
</script>

<Breadcrumb>
  <BreadcrumbItem href="/" aria-current="step">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/reports" aria-current="page">
    Annual reports
  </BreadcrumbItem>
  <BreadcrumbItem href="/reports/2019" isCurrentPage aria-current="page">
    2019
  </BreadcrumbItem>
</Breadcrumb>
