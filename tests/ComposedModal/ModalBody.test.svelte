<script lang="ts">
  import {
    ComposedModal,
    ModalBody,
    ModalHeader,
  } from "carbon-components-svelte";
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
