<script lang="ts">
import { Checkbox } from "carbon-components-svelte";

export let checked = false;
export let indeterminate = false;
export let disabled = false;
export let hideLabel = false;
export let labelText = "Checkbox label";
</script>

<Checkbox
  bind:checked
  bind:indeterminate
  {disabled}
  {hideLabel}
  {labelText}
  data-testid="checkbox"
  on:check={() => console.log("check")}
  on:click={() => console.log("click")}
/>
