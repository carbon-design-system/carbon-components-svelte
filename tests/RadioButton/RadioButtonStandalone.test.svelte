<svelte:options accessors />

<script lang="ts">
  import { RadioButton } from "carbon-components-svelte";

  export let checked = false;
</script>

<RadioButton
  bind:checked
  value="standalone"
  labelText="Standalone Option"
  name="standalone-radio"
/>
