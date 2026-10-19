<svelte:options accessors />

<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";

  export let checked = false;
  export let onCheck: (event: CustomEvent<boolean>) => void = () => {};
</script>

<Checkbox
  bind:checked
  labelText="Reactive bind test"
  data-testid="checkbox-reactive"
  on:check={onCheck}
/>
