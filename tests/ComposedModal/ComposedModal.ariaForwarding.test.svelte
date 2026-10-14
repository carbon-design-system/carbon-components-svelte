<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";

  export let alert = false;
</script>

<span id="extra-help">Extra help</span>
<span id="ext-label">External label</span>

<ComposedModal open {alert} {...$$restProps}>
  <ModalHeader title="Title" />
  <ModalBody>Body text</ModalBody>
</ComposedModal>
