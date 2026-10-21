<svelte:options accessors />

<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import type { ComponentProps } from "svelte";

  export let status: ComponentProps<InlineLoading>["status"] = "active";
  export let successDelay = 1500;
  export let onSuccess: () => void = () => {};
</script>

<InlineLoading
  {status}
  {successDelay}
  description="Working"
  on:success={onSuccess}
/>
