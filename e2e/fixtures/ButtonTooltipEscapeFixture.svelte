<script>
  import { Button, Modal } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  let open = true;
</script>

<Modal
  data-testid="modal"
  bind:open
  modalHeading="Tooltip Escape"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
>
  <Button
    kind="ghost"
    icon={Add}
    iconDescription="Add item"
    portalTooltip={false}
  />
  <Button kind="ghost" icon={Edit} iconDescription="Edit item" />
</Modal>
