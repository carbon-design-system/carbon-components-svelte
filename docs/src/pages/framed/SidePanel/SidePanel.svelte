<script>
  import {
    Button,
    Content,
    Header,
    Select,
    SelectItem,
    SidePanel,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button on:click={() => (open = true)}>Edit deployment</Button>
</Content>

<SidePanel
  bind:open
  labelText="checkout-api"
  title="Edit deployment"
  subtitle="Changes apply on the next deploy."
>
  <Stack gap={6}>
    <TextInput labelText="Service name" value="checkout-api" />
    <Select labelText="Region" selected="us-east">
      <SelectItem value="us-east" text="US East" />
      <SelectItem value="eu-central" text="EU Central" />
      <SelectItem value="ap-south" text="AP South" />
    </Select>
    <TextInput labelText="Start command" value="node server.js" />
  </Stack>
  <svelte:fragment slot="actions">
    <Button kind="secondary" on:click={() => (open = false)}>Cancel</Button>
    <Button on:click={() => (open = false)}>Save</Button>
  </svelte:fragment>
</SidePanel>
