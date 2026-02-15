<script lang="ts">
  import { Modal, MultiSelect } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let multiSelectOpen = true;
  export let portalMenu: ComponentProps<MultiSelect>["portalMenu"] = undefined;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Modal bind:open={modalOpen} modalHeading="Test" primaryButtonText="OK" secondaryButtonText="Cancel">
  <MultiSelect
    {items}
    labelText="Contact"
    placeholder="Select"
    open={multiSelectOpen}
    {portalMenu}
  />
</Modal>
