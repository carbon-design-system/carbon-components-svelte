<script>
  import {
    Button,
    Content,
    Header,
    Layer,
    SidePanel,
    Stack,
    TextInput,
    Tile,
  } from "carbon-components-svelte";

  let open = true;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button on:click={() => (open = true)}>Edit scaling</Button>
</Content>

<SidePanel bind:open title="Scaling">
  <Stack gap={6}>
    <TextInput labelText="Minimum instances" value="2" />
    <Tile>
      <Stack gap={5}>
        <p>Autoscaling</p>
        <Layer>
          <TextInput labelText="Target CPU (%)" value="70" />
        </Layer>
      </Stack>
    </Tile>
  </Stack>
</SidePanel>
