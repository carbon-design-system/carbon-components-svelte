<script>
  import {
    Button,
    Content,
    Header,
    SidePanel,
    Stack,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button on:click={() => (open = true)}>Report an incident</Button>
</Content>

<SidePanel bind:open includeOverlay title="Report an incident">
  <Stack gap={6}>
    <TextInput labelText="Summary" value="Checkout latency above 2s" />
    <TextArea
      labelText="Details"
      value="p95 latency on checkout-api rose after the 14:05 deploy."
    />
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    <Button on:click={() => (open = false)}>Submit</Button>
  </svelte:fragment>
</SidePanel>
