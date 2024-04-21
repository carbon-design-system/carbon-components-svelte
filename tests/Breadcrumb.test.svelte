<script lang="ts">
  import { Breadcrumb, BreadcrumbItem, BreadcrumbSkeleton } from "../types";
</script>

<Breadcrumb>
  <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
  <BreadcrumbItem href="/reports">Annual reports</BreadcrumbItem>
  <BreadcrumbItem href="/reports/2019" isCurrentPage>2019</BreadcrumbItem>
  <BreadcrumbItem let:props>
    <a {...props} href="/reports/2019/q1">Q1</a>
  </BreadcrumbItem>
</Breadcrumb>

<BreadcrumbSkeleton noTrailingSlash count="{3}" />
