<script>
  import {
    Button,
    Content,
    Layer,
    Stack,
    Tearsheet,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Content>
  <Button on:click={() => (open = true)}>Edit service</Button>
</Content>

<Tearsheet bind:open titleText="Edit service">
  <Stack gap={6}>
    <TextInput labelText="On the page surface" />
    <Layer>
      <TextInput labelText="Inside a Layer" />
    </Layer>
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    <Button on:click={() => (open = false)}>Save</Button>
  </svelte:fragment>
</Tearsheet>
