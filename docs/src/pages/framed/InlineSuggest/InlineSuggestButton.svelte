<script>
  import { InlineSuggest, TextInput } from "carbon-components-svelte";

  let ref = null;
  let value = "";

  const domains = ["gmail.com", "outlook.com", "icloud.com"];
</script>

<TextInput
  bind:ref
  bind:value
  type="email"
  labelText="Email"
  helperText="The button shows on touch screens. Here it is forced on"
/>
<InlineSuggest field={ref} source={domains} after="@" acceptButton />
