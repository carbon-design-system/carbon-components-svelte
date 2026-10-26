<script lang="ts">
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";

  export let portalTooltip = false;
  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <PasswordInput labelText="API key" {portalTooltip} />
  <input aria-label="Other control" />
</div>
