<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import type { ComponentProps } from "svelte";

  export let modalOpen = true;
  export let toggletipOpen = false;
  export let portalTooltip: ComponentProps<Toggletip>["portalTooltip"] =
    undefined;
</script>

<Modal
  bind:open={modalOpen}
  passiveModal
  modalHeading="Test"
  data-testid="modal"
>
  <Toggletip
    id="tt"
    bind:open={toggletipOpen}
    {portalTooltip}
    iconDescription="Information"
  >
    <p>Content</p>
  </Toggletip>
</Modal>
