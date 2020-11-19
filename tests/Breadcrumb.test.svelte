<script lang="ts">
  import { Breadcrumb, BreadcrumbItem } from "../types";
</script>

<Breadcrumb>
  <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/reports">Annual reports</BreadcrumbItem>
  <BreadcrumbItem href="/reports/2019" isCurrentPage>2019</BreadcrumbItem>
</Breadcrumb>

<Breadcrumb noTrailingSlash>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/profile" isCurrentPage>Profile</BreadcrumbItem>
</Breadcrumb>

<Breadcrumb noTrailingSlash skeleton count="{3}" />
