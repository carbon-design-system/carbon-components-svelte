<script>
  import { Button, Content, Header, SidePanel } from "carbon-components-svelte";

  let open = true;
  let width = undefined;
</script>

<Header companyName="IBM" platformName="Cloud" />
<Content>
  <Button on:click={() => (open = true)}>View logs</Button>
  <p>Width: {width ?? "md"}</p>
</Content>

<SidePanel bind:open bind:width resizable title="Logs">
  <p>14:08:12 GET /health 200 3ms</p>
  <p>14:08:15 POST /orders 201 48ms</p>
  <p>14:08:19 GET /orders/1042 200 12ms</p>
</SidePanel>
