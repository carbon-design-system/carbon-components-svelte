<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<SelectableTile form="outer-form" name="tile" value="a" selected
  >Tile</SelectableTile
>
