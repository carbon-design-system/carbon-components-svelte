<script lang="ts">
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import { tick } from "svelte";

  let elsewhere: HTMLInputElement;
</script>

<Pagination
  page={2}
  totalItems={20}
  pageSize={10}
  on:change={async () => {
    await tick();
    elsewhere.focus();
  }}
/>

<input aria-label="Elsewhere" bind:this={elsewhere}>
