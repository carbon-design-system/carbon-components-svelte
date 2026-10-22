<script lang="ts">
  import ExpandableTile from "carbon-components-svelte/Tile/ExpandableTile.svelte";

  export let hasInteractiveContent: boolean | undefined = undefined;
</script>

<ExpandableTile id="plan" {hasInteractiveContent}>
  <div slot="above"><a href="/plans">Compare plans</a></div>
  <div slot="below">Billed monthly</div>
</ExpandableTile>
