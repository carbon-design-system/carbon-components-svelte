<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";

  export let composed = false;
  export let onclose: (() => void) | undefined = undefined;

  let open = false;
</script>

<button type="button" on:click={() => (open = true)}>Open</button>

{#if composed}
  <ComposedModal bind:open on:close={() => onclose?.()}>
    <ModalHeader title="Release notes" />
    <ModalBody>
      Version 2.4 adds audit logs.
      <a href="#changelog">Read the changelog</a>
    </ModalBody>
  </ComposedModal>
{:else}
  <Modal
    bind:open
    passiveModal
    modalHeading="Release notes"
    on:close={() => onclose?.()}
  >
    Version 2.4 adds audit logs.
    <a href="#changelog">Read the changelog</a>
  </Modal>
{/if}
