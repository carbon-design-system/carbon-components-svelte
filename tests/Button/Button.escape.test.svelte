<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  export let portalTooltip = false;
  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <Button
    data-testid="button"
    icon={Add}
    iconDescription="Add item"
    {portalTooltip}
  />
  <input aria-label="Other control">
</div>
