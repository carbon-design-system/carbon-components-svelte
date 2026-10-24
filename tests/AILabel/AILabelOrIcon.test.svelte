<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";

  export let ai = true;
</script>

{#if ai}
  <AILabel />
{:else}
  <span data-testid="icon">i</span>
{/if}
