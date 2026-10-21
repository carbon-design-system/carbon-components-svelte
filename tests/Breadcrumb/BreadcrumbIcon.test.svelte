<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";
</script>

<Breadcrumb>
  <BreadcrumbItem href="/" icon={Home}>Icon prop</BreadcrumbItem>
  <BreadcrumbItem href="/settings">
    <Home slot="icon" />
    Icon slot
  </BreadcrumbItem>
  <BreadcrumbItem icon={Home}>No href icon prop</BreadcrumbItem>
  <BreadcrumbItem>
    <Home slot="icon" />
    No href icon slot
  </BreadcrumbItem>
  <BreadcrumbItem href="/settings/profile" isCurrentPage>
    No icon
  </BreadcrumbItem>
</Breadcrumb>
