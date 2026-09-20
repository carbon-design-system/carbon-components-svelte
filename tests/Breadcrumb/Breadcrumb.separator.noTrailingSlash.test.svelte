<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
</script>

<Breadcrumb separator="→" noTrailingSlash>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/settings" isCurrentPage>Settings</BreadcrumbItem>
</Breadcrumb>
