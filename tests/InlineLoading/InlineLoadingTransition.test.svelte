<svelte:options accessors />

<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import type { ComponentProps } from "svelte";

  export let status: ComponentProps<InlineLoading>["status"] = "active";
</script>

<InlineLoading
  {status}
  description="Working"
  on:success={() => {
    console.log("success");
  }}
/>
