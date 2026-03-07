<script>
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";
</script>

<div class="fixture-container">
  <Breadcrumb data-testid="breadcrumb">
    <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
    <BreadcrumbItem href="/reports">Annual reports</BreadcrumbItem>
    <BreadcrumbItem href="/reports/2019" isCurrentPage>2019</BreadcrumbItem>
  </Breadcrumb>
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
