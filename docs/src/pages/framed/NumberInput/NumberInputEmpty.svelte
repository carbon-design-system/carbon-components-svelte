<script>
  import { NumberInput, Button } from "carbon-components-svelte";

  let value = null;
  let invalid = false;
</script>

<NumberInput required="{false}" bind:value="{value}" invalid="{invalid}" />

<div style="margin: var(--cds-layout-01) 0">
  <Button on:click="{() => (value = null)}">Set to null</Button>
  <Button on:click="{() => (value = 0)}">Set to 0</Button>
  <Button on:click="{() => (invalid = !invalid)}">Toggle invalid</Button>
</div>

<p>
  <strong>Value:</strong>
  {value}
</p>
<p>
  <strong>Invalid:</strong>
  {invalid}
</p>
