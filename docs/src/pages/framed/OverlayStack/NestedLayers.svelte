<script>
  import {
    Button,
    Menu,
    MenuItem,
    Modal,
    Popover,
    Stack,
  } from "carbon-components-svelte";

  let modalOpen = false;
  let popoverOpen = false;
  let menuOpen = false;
  let menuAnchor;
  const closed = [];
  let log = "";

  /** @param {string} layer */
  const record = (layer) => () => {
    closed.push(layer);
    log = closed.join(", ");
  };
</script>

<Button on:click={() => (modalOpen = true)}>Open modal</Button>
<p>Closed in order: {log || "nothing yet"}</p>

<Modal
  bind:open={modalOpen}
  passiveModal
  modalHeading="Press Escape three times"
  on:close={record("modal")}
>
  <Stack gap={5}>
    <p>
      Open the popover, then its menu. Each Escape closes the top layer and
      returns focus to the control that opened it.
    </p>
    <div>
      <Button kind="tertiary" on:click={() => (popoverOpen = !popoverOpen)}>
        Toggle popover
      </Button>
      <Popover
        bind:open={popoverOpen}
        closeOnEscape
        closeOnOutsideClick
        on:close={record("popover")}
      >
        <Stack gap={4}>
          <p>A popover over the modal.</p>
          <Button
            kind="ghost"
            bind:ref={menuAnchor}
            on:click={() => (menuOpen = !menuOpen)}
          >
            Open menu
          </Button>
        </Stack>
      </Popover>
    </div>
  </Stack>
  <Menu
    bind:open={menuOpen}
    anchor={menuAnchor}
    aria-label="Actions"
    on:close={record("menu")}
  >
    <MenuItem labelText="Rename" />
    <MenuItem labelText="Delete" />
  </Menu>
</Modal>
