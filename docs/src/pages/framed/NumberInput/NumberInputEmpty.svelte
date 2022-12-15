<script>
  import { NumberInput, Button } from "carbon-components-svelte";

  let value = null;
  let invalid = false;
  let min;
  let max;
  let required = false;
</script>

<NumberInput
  required="{required}"
  bind:value="{value}"
  max="{max}"
  min="{min}"
  invalid="{invalid}"
/>

<div style="margin: var(--cds-layout-01) 0">
  <Button on:click="{() => (value = null)}">Set to null</Button>
  <Button on:click="{() => (value = 0)}">Set to 0</Button>
  <Button on:click="{() => (invalid = !invalid)}">Toggle invalid</Button>
  <Button on:click="{() => (required = !required)}">Toggle required</Button>
</div>

<p>
  <strong>Value:</strong>
  {value}
</p>
<p>
  <strong>Invalid:</strong>
  {invalid}
</p>

<p>
  <strong>Required:</strong>
  {required}
</p>

<NumberInput required="{false}" bind:value="{max}" label="Max" />
<NumberInput required="{false}" bind:value="{min}" label="Min" />
