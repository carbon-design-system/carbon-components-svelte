<script>
  import {
    Button,
    Dropdown,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";

  let dialog = null;
</script>

<button
  type="button"
  data-testid="open-dialog"
  on:click={() => dialog?.showModal()}
>
  Open dialog
</button>

<dialog data-testid="native-dialog" bind:this={dialog}>
  <Stack gap={5}>
    <p>Floating content auto-mounts into the nearest dialog ancestor.</p>
    <Dropdown
      portalMenu
      labelText="Region"
      selectedId="us-south"
      items={[
        { id: "us-south", text: "Dallas" },
        { id: "us-east", text: "Washington DC" },
        { id: "eu-de", text: "Frankfurt" },
        { id: "jp-tok", text: "Tokyo" },
      ]}
    />
    <OverflowMenu portalMenu>
      <OverflowMenuItem text="Edit" />
      <OverflowMenuItem text="Duplicate" />
      <OverflowMenuItem danger text="Delete" />
    </OverflowMenu>
    <Button kind="secondary" on:click={() => dialog?.close()}>Close</Button>
  </Stack>
</dialog>
