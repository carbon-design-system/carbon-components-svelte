<script>
  import {
    Button,
    Checkbox,
    Form,
    PinCodeInput,
  } from "carbon-components-svelte";

  let agree = false;
  let code = "";
</script>

<Form data-testid="form">
  <Checkbox bind:checked={agree} name="agree" labelText="Agree" />
  <PinCodeInput bind:value={code} name="code" count={4} labelText="Code" />
  <Button type="reset" kind="secondary">Reset</Button>
</Form>

<p data-testid="bound">{JSON.stringify({ agree, code })}</p>
