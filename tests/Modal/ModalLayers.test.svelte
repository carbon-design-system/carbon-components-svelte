<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";

  export let open = true;
  export let popoverOpen = false;
  export let menuOpen = false;
  export let onclose: (detail: unknown) => void = () => {};

  let anchor: HTMLButtonElement;
</script>

<button type="button">Page button</button>

<Modal
  bind:open
  passiveModal
  modalHeading="Layers"
  on:close={(event) => onclose(event.detail)}
>
  <div>
    <button type="button" on:click={() => (popoverOpen = !popoverOpen)}>
      Toggle popover
    </button>
    <Popover bind:open={popoverOpen} closeOnEscape closeOnOutsideClick>
      <div>Popover content</div>
    </Popover>
  </div>
  <button
    type="button"
    bind:this={anchor}
    data-testid="menu-trigger"
    on:click={() => (menuOpen = !menuOpen)}
  >
    Open menu
  </button>
  <Button iconDescription="Help" tooltipPosition="bottom">
    <span slot="icon">?</span>
  </Button>
  <input aria-label="Name" />
  <Dropdown
    labelText="Channel"
    items={[
      { id: "0", text: "Slack" },
      { id: "1", text: "Email" },
    ]}
  />
  <Menu bind:open={menuOpen} {anchor}>
    <MenuItem labelText="First" />
    <MenuItem labelText="Second" />
  </Menu>
</Modal>
