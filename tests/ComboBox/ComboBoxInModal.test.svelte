<script lang="ts">
  import { ComboBox, Modal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let comboBoxOpen = true;
  export let portalMenu: ComponentProps<ComboBox>["portalMenu"] = undefined;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Modal bind:open={modalOpen} modalHeading="Test" primaryButtonText="OK" secondaryButtonText="Cancel">
  <ComboBox
    {items}
    labelText="Contact"
    placeholder="Select"
    open={comboBoxOpen}
    {portalMenu}
  />
</Modal>
