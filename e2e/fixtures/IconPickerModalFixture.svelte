<script>
  import { IconPicker, Modal, toIconItems } from "carbon-components-svelte";
  import {
    Add,
    Calendar,
    Chat,
    Edit,
    Home,
    Save,
    Settings,
    TrashCan,
  } from "carbon-icons-svelte";

  const items = toIconItems({
    Add,
    Calendar,
    Chat,
    Edit,
    Home,
    Save,
    Settings,
    TrashCan,
  });

  let open = true;
  let value;
</script>

<Modal
  data-testid="modal"
  bind:open
  modalHeading="Choose an icon"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
>
  <IconPicker
    bind:value
    {items}
    labelText="Icon"
    searchLabelText="Search icons"
    helperText="Shown on the button"
  />
</Modal>
<output data-testid="value">{value ?? ""}</output>
<output data-testid="modal-open">{open}</output>
