<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<RadioTile form="outer-form" name="tier" value="b" checked>Tier</RadioTile>
