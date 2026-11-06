<script>
  import {
    Button,
    ComboBox,
    DatePicker,
    DatePickerInput,
    Dialog,
    Menu,
    MenuItem,
    Modal,
    Popover,
    SidePanel,
  } from "carbon-components-svelte";
  import OverlayStackHoverCard from "./OverlayStackHoverCard.svelte";

  let closed = [];
  const record = (name) => () => (closed = [...closed, name]);

  // Menu in a modal; a tooltip on a button in the menu.
  let menuModal = false;
  let menuOpen = false;
  let menuAnchor;

  // An icon Button with a tooltip that opens a menu.
  let iconMenuOpen = false;
  let iconMenuAnchor;

  // SidePanel plus a Modal.
  let panel = false;
  let panelModal = false;

  // ComboBox in a Modal.
  let comboModal = false;

  // DatePicker in a Modal.
  let dateModal = false;

  // Five deep: modal, modal, popover, menu, tooltip.
  let deepA = false;
  let deepB = false;
  let deepPopover = false;
  let deepMenu = false;
  let deepAnchor;

  // A modal, a native dialog over it, and a menu in the dialog.
  let underDialog = false;
  let nativeDialog = false;
  let dialogMenu = false;
  let dialogAnchor;

  // A HoverCard over a page that has a popover open.
  let pagePopover = false;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<main>
  <p data-testid="closed-log">{closed.join(",")}</p>

  <div data-testid="launchers">
    <button
      type="button"
      data-testid="open-menu-modal"
      on:click={() => (menuModal = true)}
    >
      Open menu modal
    </button>
    <button
      type="button"
      data-testid="open-panel"
      on:click={() => (panel = true)}
    >
      Open side panel
    </button>
    <button
      type="button"
      data-testid="open-combo-modal"
      on:click={() => (comboModal = true)}
    >
      Open combo modal
    </button>
    <button
      type="button"
      data-testid="open-date-modal"
      on:click={() => (dateModal = true)}
    >
      Open date modal
    </button>
    <button
      type="button"
      data-testid="open-deep"
      on:click={() => (deepA = true)}
    >
      Open deep
    </button>
    <button
      type="button"
      data-testid="open-under-dialog"
      on:click={() => (underDialog = true)}
    >
      Open dialog stack
    </button>
  </div>

  <div data-testid="page" style="position: relative; margin-top: 1rem">
    <button
      type="button"
      data-testid="toggle-page-popover"
      on:click={() => (pagePopover = !pagePopover)}
    >
      Toggle page popover
    </button>
    <Popover bind:open={pagePopover} closeOnEscape closeOnOutsideClick>
      <div data-testid="page-popover" style="padding: 1rem">Page popover</div>
    </Popover>
    <p>
      Author:
      <OverlayStackHoverCard />
    </p>
  </div>
</main>

<Modal
  bind:open={menuModal}
  passiveModal
  modalHeading="Menu in a modal"
  on:close={record("menu-modal")}
>
  <button
    type="button"
    bind:this={menuAnchor}
    data-testid="menu-trigger"
    on:click={() => (menuOpen = !menuOpen)}
  >
    Open menu
  </button>
  <Button
    kind="ghost"
    bind:ref={iconMenuAnchor}
    iconDescription="Row actions"
    portalTooltip={false}
    on:click={() => (iconMenuOpen = !iconMenuOpen)}
  >
    <span slot="icon" aria-hidden="true">...</span>
  </Button>
  <Menu
    bind:open={iconMenuOpen}
    anchor={iconMenuAnchor}
    aria-label="Duplicate options"
  >
    <MenuItem labelText="Duplicate" />
  </Menu>
  <Menu bind:open={menuOpen} anchor={menuAnchor} aria-label="Actions">
    <MenuItem labelText="Rename" />
    <li role="none">
      <Button
        kind="ghost"
        iconDescription="Pin item"
        tooltipPosition="right"
        portalTooltip={false}
      >
        <span slot="icon" aria-hidden="true">+</span>
      </Button>
    </li>
    <MenuItem labelText="Delete" />
  </Menu>
</Modal>

<SidePanel
  bind:open={panel}
  includeOverlay
  labelText="Settings"
  title="Side panel"
  on:close={record("panel")}
>
  <button
    type="button"
    data-testid="open-panel-modal"
    on:click={() => (panelModal = true)}
  >
    Open modal over panel
  </button>
</SidePanel>

<Modal
  bind:open={panelModal}
  passiveModal
  modalHeading="Modal over a panel"
  on:close={record("panel-modal")}
>
  <p>Over the panel.</p>
</Modal>

<Modal
  bind:open={comboModal}
  passiveModal
  modalHeading="ComboBox in a modal"
  on:close={record("combo-modal")}
>
  <ComboBox labelText="Contact" {items} />
</Modal>

<Modal
  bind:open={dateModal}
  passiveModal
  modalHeading="DatePicker in a modal"
  on:close={record("date-modal")}
>
  <DatePicker datePickerType="single">
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</Modal>

<Modal
  bind:open={underDialog}
  passiveModal
  modalHeading="Under a dialog"
  on:close={record("under-dialog")}
>
  <button
    type="button"
    data-testid="open-dialog"
    on:click={() => (nativeDialog = true)}
  >
    Open dialog
  </button>
</Modal>

<Dialog
  bind:open={nativeDialog}
  modal
  aria-label="Native dialog"
  on:close={record("dialog")}
>
  <button
    type="button"
    data-testid="dialog-menu-trigger"
    bind:this={dialogAnchor}
    on:click={() => (dialogMenu = !dialogMenu)}
  >
    Open dialog menu
  </button>
  <Menu
    bind:open={dialogMenu}
    anchor={dialogAnchor}
    aria-label="Dialog actions"
  >
    <MenuItem labelText="One" />
  </Menu>
</Dialog>

<Modal
  bind:open={deepA}
  passiveModal
  modalHeading="Deep A"
  on:close={record("deep-a")}
>
  <button
    type="button"
    data-testid="open-deep-b"
    on:click={() => (deepB = true)}
  >
    Open B
  </button>
</Modal>

<Modal
  bind:open={deepB}
  passiveModal
  modalHeading="Deep B"
  on:close={record("deep-b")}
>
  <div style="position: relative">
    <button
      type="button"
      data-testid="toggle-deep-popover"
      on:click={() => (deepPopover = !deepPopover)}
    >
      Toggle popover
    </button>
    <Popover
      bind:open={deepPopover}
      closeOnEscape
      closeOnOutsideClick
      on:close={record("deep-popover")}
    >
      <div style="padding: 1rem">
        <button
          type="button"
          bind:this={deepAnchor}
          data-testid="open-deep-menu"
          on:click={() => (deepMenu = !deepMenu)}
        >
          Open menu
        </button>
      </div>
    </Popover>
  </div>
  <Menu
    bind:open={deepMenu}
    anchor={deepAnchor}
    aria-label="Deep actions"
    on:close={record("deep-menu")}
  >
    <li role="none">
      <Button
        kind="ghost"
        iconDescription="Deep pin"
        tooltipPosition="right"
        portalTooltip={false}
      >
        <span slot="icon" aria-hidden="true">+</span>
      </Button>
    </li>
    <MenuItem labelText="Deep item" />
  </Menu>
</Modal>
