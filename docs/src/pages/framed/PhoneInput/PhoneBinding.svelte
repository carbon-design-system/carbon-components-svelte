<script>
  import { PhoneInput } from "carbon-components-svelte";

  let value = "";
  let country = "US";
  let complete = false;
</script>

<PhoneInput
  labelText="Mobile phone"
  helperText="Choose a country, then enter the number"
  bind:value
  bind:country
  bind:complete
/>
<p>Value: <code>{value || "(empty)"}</code></p>
<p>Country: <code>{country}</code></p>
<p>Complete: <code>{complete}</code></p>
