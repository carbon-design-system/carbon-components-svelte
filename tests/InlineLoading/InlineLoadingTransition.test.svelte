<svelte:options accessors />

<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import type { ComponentProps } from "svelte";

  export let status: ComponentProps<InlineLoading>["status"] = "active";
  export let onSuccess: () => void = () => {};
</script>

<InlineLoading {status} description="Working" on:success={onSuccess} />
