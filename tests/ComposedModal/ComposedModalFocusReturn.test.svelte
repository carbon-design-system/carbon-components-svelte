<script lang="ts">
  import {
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";

  let open = false;
</script>

<button type="button" on:click={() => (open = true)}>Open Modal</button>
<ComposedModal bind:open>
  <ModalHeader title="Focus Return Test" />
  <ModalBody />
  <ModalFooter primaryButtonText="Save" secondaryButtonText="Cancel" />
</ComposedModal>
