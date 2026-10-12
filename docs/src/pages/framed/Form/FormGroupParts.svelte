<script>
  import {
    Checkbox,
    Form,
    FormGroup,
    FormHelperText,
    FormRequirement,
  } from "carbon-components-svelte";

  let email = false;
  let sms = false;

  $: empty = !email && !sms;
</script>

<Form>
  <FormGroup legendText="Contact preferences" invalid={empty}>
    <Checkbox
      name="contact"
      value="email"
      labelText="Email"
      bind:checked={email}
    />
    <Checkbox name="contact" value="sms" labelText="SMS" bind:checked={sms} />
    <FormHelperText>We only contact you about your account</FormHelperText>
    {#if empty}
      <FormRequirement>Select at least one contact method</FormRequirement>
    {/if}
  </FormGroup>
</Form>
