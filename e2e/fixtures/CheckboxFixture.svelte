<script>
  import { Checkbox } from "carbon-components-svelte";

  let checked = false;
</script>

<Checkbox
  data-testid="checkbox-agree"
  labelText="I agree to the terms"
  bind:checked
/>

<Checkbox
  data-testid="checkbox-disabled"
  labelText="Disabled option"
  disabled={true}
/>
