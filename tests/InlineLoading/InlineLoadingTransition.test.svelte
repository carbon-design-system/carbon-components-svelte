<svelte:options accessors />

<script lang="ts">
  import { InlineLoading } from "carbon-components-svelte";

  export let status: "active" | "finished" = "active";
</script>

<InlineLoading
  {status}
  description="Working"
  on:success={() => {
    console.log("success");
  }}
/>
