<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";

  export let onEvent: (type: string) => void = () => {};
</script>

<InlineLoading
  data-testid="events"
  description="Working"
  on:click={() => onEvent("click")}
  on:mouseover={() => onEvent("mouseover")}
  on:mouseenter={() => onEvent("mouseenter")}
  on:mouseleave={() => onEvent("mouseleave")}
/>
