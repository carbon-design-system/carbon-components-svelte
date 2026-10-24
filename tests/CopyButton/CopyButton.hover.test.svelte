<script lang="ts">
  import CopyButton from "carbon-components-svelte/CopyButton/CopyButton.svelte";

  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <CopyButton text="us-east-1" iconDescription="Copy region" />
</div>
