<script>
  import { Button, Checkbox } from "carbon-components-svelte";

  let checked = false;
</script>

<Checkbox labelText="Label text" bind:checked />

<div style="margin: var(--cds-layout-01) 0">
  <Button on:click={() => (checked = !checked)}>Toggle</Button>
</div>

<strong>checked:</strong>
{checked}
