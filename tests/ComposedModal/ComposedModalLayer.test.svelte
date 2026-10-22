<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalFooter from "carbon-components-svelte/ComposedModal/ModalFooter.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import Layer from "carbon-components-svelte/Layer/Layer.svelte";
</script>

<Layer>
  <ComposedModal open data-testid="modal">
    <ModalHeader title="Workspace settings">
      <Layer data-testid="header-layer" />
    </ModalHeader>
    <ModalBody data-testid="body">
      <Layer data-testid="body-layer" />
    </ModalBody>
    <ModalFooter primaryButtonText="Save">
      <Layer data-testid="footer-layer" />
    </ModalFooter>
  </ComposedModal>
</Layer>
