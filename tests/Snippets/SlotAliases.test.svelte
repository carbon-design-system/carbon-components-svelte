<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
</script>

<Toggletip>
  {#snippet labelChildren()}
    <strong data-testid="toggletip-label-children">Density</strong>
  {/snippet}
  Content
</Toggletip>
