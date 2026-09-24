<script>
  import { Button, Checkbox, Form } from "carbon-components-svelte";

  let agree = false;
</script>

<Form data-testid="form">
  <Checkbox bind:checked={agree} name="agree" labelText="Agree" />
  <Button type="reset" kind="secondary">Reset</Button>
</Form>

<p data-testid="bound">{JSON.stringify({ agree })}</p>
