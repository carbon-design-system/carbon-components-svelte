<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  let siblingOpen = false;
  let childOpen = false;
</script>

<Modal open modalHeading="Modal" passiveModal data-testid="modal">
  <button
    type="button"
    data-testid="launch-sibling-modal"
    on:click={() => (siblingOpen = true)}
  >
    Launch sibling modal
  </button>
</Modal>

<Modal
  bind:open={siblingOpen}
  modalHeading="Sibling modal"
  passiveModal
  data-testid="sibling-modal"
>
  <button
    type="button"
    data-testid="launch-child-modal"
    on:click={() => (childOpen = true)}
  >
    Launch child modal
  </button>

  <Modal
    bind:open={childOpen}
    modalHeading="Child modal"
    passiveModal
    data-testid="child-modal"
  />
</Modal>
