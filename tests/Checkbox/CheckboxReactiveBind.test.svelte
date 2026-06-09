<svelte:options accessors />

<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let checked = false;
</script>

<Checkbox
  bind:checked
  labelText="Reactive bind test"
  data-testid="checkbox-reactive"
  on:check={() => console.log("check")}
/>
