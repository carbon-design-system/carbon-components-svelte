<script lang="ts">
  import { Portal } from "carbon-components-svelte";

  export let showPortal = true;
</script>

{#if showPortal}
  <Portal>
    <!-- svelte-ignore a11y-autofocus -- required for focus preservation test -->
    <input data-testid="portal-input" autofocus aria-label="Portal input" />
  </Portal>
{/if}
