<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";

  let siblingOpen = false;
  let childOpen = false;
</script>

<ComposedModal open data-testid="modal">
  <ModalHeader title="Modal" />
  <button
    type="button"
    data-testid="launch-sibling-modal"
    on:click={() => (siblingOpen = true)}
  >
    Launch sibling modal
  </button>
</ComposedModal>

<ComposedModal bind:open={siblingOpen} data-testid="sibling-modal">
  <ModalHeader title="Sibling modal" />
  <button
    type="button"
    data-testid="launch-child-modal"
    on:click={() => (childOpen = true)}
  >
    Launch child modal
  </button>

  <ComposedModal bind:open={childOpen} data-testid="child-modal">
    <ModalHeader title="Child modal" />
  </ComposedModal>
</ComposedModal>
