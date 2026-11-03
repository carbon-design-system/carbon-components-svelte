<script>
  import { mask, TextInput } from "carbon-components-svelte";

  let value = "";
  let rawValue = "";
  let complete = false;
</script>

<div
  use:mask={{
    pattern: "(999) 999-9999",
    onchange: (detail) => {
      rawValue = detail.rawValue;
      complete = detail.complete;
    },
  }}
>
  <TextInput
    labelText="Phone number"
    helperText="Format: (555) 555-5555"
    placeholder="(___) ___-____"
    autocomplete="tel-national"
    bind:value
  />
</div>
<p>Value: <code>{value}</code></p>
<p>Raw value: <code>{rawValue}</code></p>
<p>Complete: <code>{complete}</code></p>
