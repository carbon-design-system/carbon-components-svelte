<script lang="ts">
  import { Dropdown, Modal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let dropdownOpen = true;
  export let portalMenu: ComponentProps<Dropdown>["portalMenu"] = undefined;

  const items = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
</script>

<Modal bind:open={modalOpen} modalHeading="Test" primaryButtonText="OK" secondaryButtonText="Cancel">
  <Dropdown
    {items}
    selectedId="0"
    labelText="Contact"
    open={dropdownOpen}
    {portalMenu}
  />
</Modal>
