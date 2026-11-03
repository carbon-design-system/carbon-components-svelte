<script>
  import { PhoneInput } from "carbon-components-svelte";

  let value = "";
  let complete = false;
  let touched = false;
</script>

<PhoneInput
  labelText="Phone"
  country="US"
  helperText="Format: (555) 555-5555"
  invalid={touched && value !== "" && !complete}
  invalidText="Enter all ten digits"
  bind:value
  bind:complete
  on:blur={() => (touched = true)}
/>
