<script>
  import {
    Button,
    Checkbox,
    Form,
    PinCodeInput,
    Slider,
  } from "carbon-components-svelte";

  let agree = false;
  let code = "";
  let level = 20;
</script>

<Form data-testid="form">
  <Checkbox bind:checked={agree} name="agree" labelText="Agree" />
  <PinCodeInput bind:value={code} name="code" count={4} labelText="Code" />
  <Slider bind:value={level} name="level" labelText="Level" min={0} max={100} />
  <Button type="reset" kind="secondary">Reset</Button>
</Form>

<p data-testid="bound">{JSON.stringify({ agree, code, level })}</p>
