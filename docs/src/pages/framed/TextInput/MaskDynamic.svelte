<script>
  import { mask, TextInput } from "carbon-components-svelte";

  let value = "";

  /** American Express numbers have 15 digits grouped 4-6-5. */
  const pattern = (/** @type {string} */ raw) =>
    raw.startsWith("34") || raw.startsWith("37")
      ? "9999 999999 99999"
      : "9999 9999 9999 9999";
</script>

<div use:mask={{ pattern }}>
  <TextInput
    labelText="Card number"
    helperText="16 digits, or 15 for American Express"
    autocomplete="cc-number"
    bind:value
  />
</div>
