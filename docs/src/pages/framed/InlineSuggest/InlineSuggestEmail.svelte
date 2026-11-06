<script>
  import { InlineSuggest, TextInput } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  // Most likely first: the first domain the text is a prefix of wins.
  const domains = ["gmail.com", "outlook.com", "icloud.com", "yahoo.com"];
</script>

<TextInput
  bind:ref
  bind:value
  type="email"
  labelText="Email"
  helperText="Type an address, then press Tab to finish the domain"
/>
<InlineSuggest field={ref} source={domains} after="@" />
