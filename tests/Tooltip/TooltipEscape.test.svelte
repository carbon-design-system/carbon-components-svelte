<script lang="ts">
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";

  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <Tooltip iconDescription="Information">Tooltip content</Tooltip>
  <input aria-label="Other control" />
</div>
