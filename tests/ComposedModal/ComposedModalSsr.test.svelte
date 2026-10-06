<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";

  export let label = "Label";
  export let title = "Title";
  export let showHeader = true;
  export let ariaLabel: string | undefined = undefined;
  export let ariaLabelledby: string | undefined = undefined;
</script>

<ComposedModal open aria-label={ariaLabel} aria-labelledby={ariaLabelledby}>
  {#if showHeader}
    <ModalHeader {label} {title} />
  {/if}
  <ModalBody>
    <p>Body</p>
  </ModalBody>
</ComposedModal>
