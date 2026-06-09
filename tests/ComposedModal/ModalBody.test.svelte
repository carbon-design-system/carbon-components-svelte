<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import type { ComponentProps } from "svelte";

  export let open = true;
  export let hasForm: ComponentProps<ModalBody>["hasForm"] = false;
  export let hasScrollingContent: ComponentProps<ModalBody>["hasScrollingContent"] = false;
  export let slotContent = "";
</script>

<ComposedModal bind:open>
  <ModalHeader title="Test Modal" />
  <ModalBody {hasForm} {hasScrollingContent} {...$$restProps}>
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </ModalBody>
</ComposedModal>
