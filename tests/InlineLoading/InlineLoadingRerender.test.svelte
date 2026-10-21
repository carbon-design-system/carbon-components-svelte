<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";

  export let tick = 0;
  export let onSuccess: () => void = () => {};
</script>

<InlineLoading
  status="finished"
  description="Render {tick}"
  on:success={onSuccess}
/>
