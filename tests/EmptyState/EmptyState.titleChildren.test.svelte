<script lang="ts">
  import EmptyState from "carbon-components-svelte/EmptyState/EmptyState.svelte";

  export let title = "";
</script>

<EmptyState {title}>
  <svelte:fragment slot="titleChildren">Custom <em>title</em></svelte:fragment>
</EmptyState>
