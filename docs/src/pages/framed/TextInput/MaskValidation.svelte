<script>
  import { mask, TextInput } from "carbon-components-svelte";

  let value = "";
  let complete = false;
  let touched = false;
</script>

<div
  use:mask={{
    pattern: "999-99-9999",
    onchange: (detail) => (complete = detail.complete),
  }}
>
  <TextInput
    labelText="Tax identifier"
    helperText="Format: 555-55-5555"
    invalidText="Enter all nine digits"
    invalid={touched && !complete && value !== ""}
    bind:value
    on:blur={() => (touched = true)}
  />
</div>
