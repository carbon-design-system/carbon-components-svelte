<script>
  import {
    Button,
    FluidForm,
    Modal,
    PasswordInput,
    Select,
    SelectItem,
    TextInput,
  } from "carbon-components-svelte";

  let open = false;
</script>

<Button on:click={() => (open = true)}>Register application</Button>

<Modal
  fullWidth
  bind:open
  modalLabel="Application"
  modalHeading="Register application"
  primaryButtonText="Add"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <FluidForm>
    <TextInput
      labelText="Application name"
      placeholder="customer-portal"
      required
    />
    <PasswordInput
      required
      type="password"
      labelText="Admin password"
      placeholder="Enter admin password..."
    />
    <Select labelText="Deployment region">
      <SelectItem value="us-east" text="US East (Washington DC)" />
      <SelectItem value="us-south" text="US South (Dallas)" />
      <SelectItem value="eu-de" text="EU Germany (Frankfurt)" />
    </Select>
  </FluidForm>
</Modal>
