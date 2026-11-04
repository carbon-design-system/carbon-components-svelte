<script>
  import { mask, TextInput } from "carbon-components-svelte";

  let value = "";
</script>

<div use:mask={{ pattern: "AA99 9999 9999 9999 99" }}>
  <TextInput
    labelText="Account number"
    helperText="Two letters, then 16 digits"
    bind:value
  />
</div>
