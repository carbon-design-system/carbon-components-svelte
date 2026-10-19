<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";

  export let onSubmit: (event: SubmitEvent) => void = () => {};
</script>

<form on:submit|preventDefault={onSubmit}>
  <SelectableTile value="a">Tile A</SelectableTile>
  <button type="submit">Submit</button>
</form>
