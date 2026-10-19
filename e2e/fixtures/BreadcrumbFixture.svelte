<script>
  import { Breadcrumb, BreadcrumbItem } from "carbon-components-svelte";
</script>

<Breadcrumb data-testid="breadcrumb">
  <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/reports">Annual reports</BreadcrumbItem>
  <BreadcrumbItem href="/reports/2019" isCurrentPage>2019</BreadcrumbItem>
</Breadcrumb>

<div style="width: 16rem" data-testid="narrow">
  <Breadcrumb noTrailingSlash labelText="Project trail">
    <BreadcrumbItem href="/">Projects</BreadcrumbItem>
    <BreadcrumbItem href="/a"
      >Datenschutzgrundverordnungskonformitätsprüfung</BreadcrumbItem
    >
    <BreadcrumbItem href="/b" isCurrentPage
      >Replicate every nightly backup to a second region before retiring the old
      cluster</BreadcrumbItem
    >
  </Breadcrumb>
</div>
