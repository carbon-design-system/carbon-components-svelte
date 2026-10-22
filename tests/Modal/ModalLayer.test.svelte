<script lang="ts">
  import Layer from "carbon-components-svelte/Layer/Layer.svelte";
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
</script>

<Layer>
  <Modal open modalHeading="Workspace settings" data-testid="modal">
    <Layer data-testid="body-layer">
      <Layer data-testid="deeper-layer" />
    </Layer>
  </Modal>
</Layer>
