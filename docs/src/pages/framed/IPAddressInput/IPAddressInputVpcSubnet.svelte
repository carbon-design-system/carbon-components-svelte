<script>
  import {
    Button,
    ButtonSet,
    Form,
    IPAddressInput,
    Stack,
  } from "carbon-components-svelte";

  const vpc = "10.240.0.0/16";
  const existing = ["10.240.1.0/24", "10.240.2.0/24"];

  let value = "10.240.3.0/24";
  let valid = true;
  let submitted = "";

  function handleSubmit(event) {
    event.preventDefault();
    submitted = String(new FormData(event.target).get("cidr") ?? "");
  }
</script>

<Form on:submit={handleSubmit}>
  <Stack gap={5}>
    <IPAddressInput
      bind:value
      bind:valid
      name="cidr"
      labelText="Subnet CIDR block"
      helperText="Inside {vpc}, from /16 to /28, and clear of the existing subnets"
      allow={["cidr"]}
      version={4}
      within={vpc}
      excludes={existing}
      minPrefix={16}
      maxPrefix={28}
      required
    />
    <ButtonSet>
      <Button kind="secondary" type="reset">Reset</Button>
      <Button type="submit">Create subnet</Button>
    </ButtonSet>
    <p>Existing subnets: {existing.join(", ")}</p>
    <p>Valid: {valid}. Submitted: {submitted || "nothing yet"}</p>
  </Stack>
</Form>
