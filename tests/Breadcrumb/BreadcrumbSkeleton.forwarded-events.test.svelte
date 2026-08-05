<script lang="ts">
  import BreadcrumbSkeleton from "carbon-components-svelte/Breadcrumb/BreadcrumbSkeleton.svelte";
</script>

<BreadcrumbSkeleton
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
/>
