<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
</script>

<ComposedModal open alert {...$$restProps}>
  <ModalHeader title="Delete file" />
  <ModalBody>This cannot be undone.</ModalBody>
</ComposedModal>
