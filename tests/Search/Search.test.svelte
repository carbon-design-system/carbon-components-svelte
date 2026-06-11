<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<Search>["size"] = undefined;
  export let fluid = false;

  let value = "";
</script>

<Search
  bind:value
  {size}
  {fluid}
  labelText="Default search"
  placeholder="Search"
  closeButtonLabelText="Clear value"
  on:clear={() => {
    console.log("clear");
  }}
/>

<Search disabled labelText="Disabled search" placeholder="Search disabled..." />
