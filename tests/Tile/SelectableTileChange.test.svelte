<script lang="ts">
  import SelectableTile from "carbon-components-svelte/Tile/SelectableTile.svelte";

  export let onChange: (checked: boolean, selected: boolean) => void;

  let selected = false;

  function handleChange(event: Event) {
    onChange((event.target as HTMLInputElement).checked, selected);
  }
</script>

<SelectableTile bind:selected value="standard" on:change={handleChange}>
  Standard
</SelectableTile>
