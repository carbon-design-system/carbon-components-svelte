<script>
  import { TextInput } from "carbon-components-svelte";

  let value = "";
</script>

<TextInput
  data-testid="text-input-username"
  labelText="User name"
  placeholder="Enter your name"
  bind:value
/>

<TextInput
  data-testid="text-input-disabled"
  labelText="Disabled field"
  placeholder="Cannot edit"
  disabled={true}
/>

<TextInput
  data-testid="text-input-invalid"
  labelText="Invalid field"
  placeholder="Has error"
  invalid={true}
  invalidText="This field is required"
/>

<div data-testid="text-input-fluid-counter-case">
  <TextInput fluid labelText="Nickname" maxCount={10} value="abc" />
</div>
