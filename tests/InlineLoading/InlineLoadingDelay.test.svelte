<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import type { ComponentProps } from "svelte";

  export let status: ComponentProps<InlineLoading>["status"] = "active";
  export let delay = 0;
  export let description: string | undefined = undefined;
  export let onSuccess: () => void = () => {};
</script>

<div data-testid="delayed">
  <InlineLoading
    {status}
    {delay}
    {description}
    successDelay={1000}
    on:success={onSuccess}
  />
</div>
