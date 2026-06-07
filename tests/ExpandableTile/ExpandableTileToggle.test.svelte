<script lang="ts">
  import { ExpandableTile } from "carbon-components-svelte";

  export let interactive = false;
</script>

<ExpandableTile data-testid="toggle" hasInteractiveContent={interactive}>
  <div slot="above">Above the fold</div>
  <div slot="below">Below the fold</div>
</ExpandableTile>
