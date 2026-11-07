<script>
  import {
    Button,
    Content,
    Header,
    SidePanel,
    Stack,
  } from "carbon-components-svelte";

  let open = true;
  let width;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Stack gap={5}>
    <Button on:click={() => (open = true)}>View logs</Button>
    <p>Width: {width ?? "md"}</p>
  </Stack>
</Content>

<SidePanel bind:open bind:width resizable titleText="Logs">
  <p>14:08:12 GET /health 200 3ms</p>
  <p>14:08:15 POST /orders 201 48ms</p>
  <p>14:08:19 GET /orders/1042 200 12ms</p>
</SidePanel>
