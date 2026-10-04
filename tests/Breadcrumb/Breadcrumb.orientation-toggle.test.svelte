<script lang="ts">
  import Breadcrumb from "carbon-components-svelte/Breadcrumb/Breadcrumb.svelte";
  import BreadcrumbItem from "carbon-components-svelte/Breadcrumb/BreadcrumbItem.svelte";
  import type { ComponentProps } from "svelte";

  const orientations: ComponentProps<Breadcrumb>["orientation"][] = [
    undefined,
    "horizontal",
    "vertical",
  ];
  let index = 0;
  $: orientation = orientations[index % orientations.length];
</script>

<button type="button" on:click={() => index++}>Next orientation</button>

<Breadcrumb {orientation}>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/settings" isCurrentPage>Settings</BreadcrumbItem>
</Breadcrumb>
