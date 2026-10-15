<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
</script>

<ComposedModal open>
  <ModalHeader title="Terms" />
  <ModalBody hasScrollingContent {...$$restProps}>Long terms.</ModalBody>
</ComposedModal>
