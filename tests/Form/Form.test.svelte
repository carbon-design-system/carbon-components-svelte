<script lang="ts">
  import { Form, FormGroup, Checkbox, Button } from "carbon-components-svelte";

  export let preventDefault = false;
</script>

<Form
  data-testid="form"
  on:submit={(e) => {
    if (preventDefault) {
      e.preventDefault();
    }
    console.log("submit", e);
  }}
>
  <FormGroup legendText="Checkboxes">
    <Checkbox id="checkbox-0" labelText="Checkbox Label" checked />
    <Checkbox id="checkbox-1" labelText="Checkbox Label" />
    <Checkbox id="checkbox-2" labelText="Checkbox Label" disabled />
  </FormGroup>
  <Button type="submit">Submit</Button>
</Form>
