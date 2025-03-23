<script lang="ts">
import { Search } from "carbon-components-svelte";

let value = "";
</script>

<Search
  bind:value
  labelText="Default search"
  placeholder="Search"
  closeButtonLabelText="Clear value"
  on:clear={() => {
    console.log("clear");
  }}
/>

<Search disabled labelText="Disabled search" placeholder="Search disabled..." />
