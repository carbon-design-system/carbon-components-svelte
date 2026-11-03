<script>
  import { Form, PhoneInput, Stack } from "carbon-components-svelte";

  let value = "";
  let country = "US";
  let complete = false;
  let changes = 0;
  let uk = "+442079460958";
</script>

<Form on:submit={(e) => e.preventDefault()}>
  <Stack gap={6}>
    <PhoneInput
      labelText="Phone"
      helperText="Choose a country, then enter the number"
      name="phone"
      bind:value
      bind:country
      bind:complete
      on:change={() => (changes += 1)}
    />
    <PhoneInput labelText="Work phone" bind:value={uk} country="GB" />
    <PhoneInput
      labelText="Invalid phone"
      invalid
      invalidText="Enter a complete number"
      country="DE"
    />
    <PhoneInput labelText="Disabled phone" disabled country="FR" />
    <PhoneInput
      labelText="Small phone"
      size="sm"
      countries={["CH", "AT", "DE"]}
      country="CH"
    />
  </Stack>
</Form>

<p data-testid="value">{value}</p>
<p data-testid="country">{country}</p>
<p data-testid="complete">{complete}</p>
<p data-testid="changes">{changes}</p>
<p data-testid="uk">{uk}</p>
