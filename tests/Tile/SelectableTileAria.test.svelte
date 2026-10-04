<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
</script>

<p id="plan-help">Billed monthly</p>
<p id="plan-label">Standard plan</p>
<SelectableTile
  value="standard"
  aria-describedby="plan-help"
  aria-labelledby="plan-label"
  data-testid="tile"
>
  Standard
</SelectableTile>
