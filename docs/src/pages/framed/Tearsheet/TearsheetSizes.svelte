<script>
  import {
    Button,
    Content,
    RadioButton,
    RadioButtonGroup,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
  let size = "wide";
</script>

<Content>
  <Stack gap={5}>
    <RadioButtonGroup legendText="Size" bind:selected={size}>
      <RadioButton labelText="wide" value="wide" />
      <RadioButton labelText="narrow" value="narrow" />
    </RadioButtonGroup>
    <Button on:click={() => (open = true)}>Add a webhook</Button>
  </Stack>
</Content>

<Tearsheet
  bind:open
  {size}
  titleText="Add a webhook"
  descriptionText="Send build events to another service."
>
  <Stack gap={6}>
    <TextInput
      labelText="Endpoint URL"
      placeholder="https://example.com/hooks"
    />
    <TextInput labelText="Signing secret" type="password" />
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    <Button on:click={() => (open = false)}>Add</Button>
  </svelte:fragment>
</Tearsheet>
