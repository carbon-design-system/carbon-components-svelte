<script lang="ts">
  import { PaginationNav } from "carbon-components-svelte";
</script>

<PaginationNav />

<PaginationNav
  total={3}
  loop
  on:change={(e) => {
    console.log(e.detail); // { page: number; }
  }}
  on:click:button--next={(e) => {
    console.log(e.detail); // { page: number; }
  }}
  on:click:button--previous={(e) => {
    console.log(e.detail); // { page: number; }
  }}
/>
