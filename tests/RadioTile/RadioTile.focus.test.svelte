<script lang="ts">
  import RadioTile from "carbon-components-svelte/Tile/RadioTile.svelte";

  export let onFocus: (e: FocusEvent) => void = () => {};
  export let onBlur: (e: FocusEvent) => void = () => {};
</script>

<RadioTile value="standard" on:focus={onFocus} on:blur={onBlur}>
  Standard
</RadioTile>
