<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";

  export let open = false;
  export let returnFocusTo: HTMLElement | (() => HTMLElement | null) | null =
    null;
</script>

<h2 data-testid="fallback" tabindex="-1">Fallback heading</h2>
<button type="button" data-testid="opener" on:click={() => (open = true)}>
  Open Modal
</button>
<ComposedModal bind:open {returnFocusTo}>
  <ModalHeader title="Return Focus To Test" hideCloseButton />
  <ModalBody />
</ComposedModal>
