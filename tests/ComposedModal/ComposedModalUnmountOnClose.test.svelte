<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";

  export let open = false;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

{#if open}
  <ComposedModal bind:open on:close={(e) => onclose?.(e)}>
    <ModalHeader title="Unmount On Close" />
    <ModalBody>Body</ModalBody>
  </ComposedModal>
{/if}
