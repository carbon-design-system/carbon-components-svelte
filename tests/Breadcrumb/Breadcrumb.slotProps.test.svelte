<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
</script>

<Breadcrumb>
  <BreadcrumbItem let:props>
    <a {...props} href="/">Dashboard</a>
  </BreadcrumbItem>
  <BreadcrumbItem isCurrentPage let:props>
    <a {...props} href="/reports">Annual reports</a>
  </BreadcrumbItem>
</Breadcrumb>
