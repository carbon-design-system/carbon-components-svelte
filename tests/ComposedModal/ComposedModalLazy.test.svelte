<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";

  export let open = false;
</script>

<ComposedModal lazy bind:open>
  <ModalHeader title="Rename project" />
  <ModalBody>
    <label>
      Name
      <input data-modal-primary-focus />
    </label>
  </ModalBody>
</ComposedModal>
