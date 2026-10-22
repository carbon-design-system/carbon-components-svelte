<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalFooter from "carbon-components-svelte/ComposedModal/ModalFooter.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import type { ComponentProps } from "svelte";

  export let hideCloseButton = false;
  export let preventCloseOnClickOutside: ComponentProps<ComposedModal>["preventCloseOnClickOutside"] =
    undefined;
  export let showFooter = true;

  let open = false;
</script>

<button type="button" on:click={() => (open = true)}>Open Modal</button>
<ComposedModal bind:open {preventCloseOnClickOutside}>
  <ModalHeader title="Focus Return Test" {hideCloseButton} />
  <ModalBody />
  {#if showFooter}
    <ModalFooter primaryButtonText="Save" secondaryButtonText="Cancel" />
  {/if}
</ComposedModal>
