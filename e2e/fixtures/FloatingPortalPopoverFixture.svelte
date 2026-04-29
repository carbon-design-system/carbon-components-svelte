<script>
  import {
    Button,
    Dropdown,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";

  let popover = null;
</script>

<button
  type="button"
  data-testid="open-popover"
  on:click={() => popover?.showPopover()}
>
  Open popover
</button>

<div
  data-testid="native-popover"
  popover="manual"
  bind:this={popover}
  style="width: min(100%, 28rem); padding: 1rem;"
>
  <Stack gap={5}>
    <p>Floating content auto-mounts into the nearest popover ancestor.</p>
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
    <Button
      kind="secondary"
      type="button"
      on:click={() => popover?.hidePopover()}
    >
      Close
    </Button>
  </Stack>
</div>
