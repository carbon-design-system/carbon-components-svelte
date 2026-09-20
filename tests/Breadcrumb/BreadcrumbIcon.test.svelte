<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
  import Home from "carbon-icons-svelte/lib/Home.svelte";

  export let size: "sm" | "md" = "md";
</script>

<Breadcrumb {size}>
  <BreadcrumbItem href="/" icon={Home}>Icon prop</BreadcrumbItem>
  <BreadcrumbItem href="/settings">
    <Home slot="icon" />
    Icon slot
  </BreadcrumbItem>
  <BreadcrumbItem href="/settings/profile" isCurrentPage>
    No icon
  </BreadcrumbItem>
</Breadcrumb>
