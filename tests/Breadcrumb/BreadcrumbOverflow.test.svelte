<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";

  export let overflow: "wrap" | "menu" = "menu";
</script>

<Breadcrumb {overflow}>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/a">Level 1</BreadcrumbItem>
  <BreadcrumbItem href="/a/b" aria-current="location">Level 2</BreadcrumbItem>
  <BreadcrumbItem href="/a/b/c">Level 3</BreadcrumbItem>
  <BreadcrumbItem href="/a/b/c/d" isCurrentPage>Current</BreadcrumbItem>
</Breadcrumb>
