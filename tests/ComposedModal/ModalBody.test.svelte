<script lang="ts">
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ModalHeader from "carbon-components-svelte/ComposedModal/ModalHeader.svelte";
  import type { ComponentProps } from "svelte";

  export let open = true;
  export let hasForm: ComponentProps<ModalBody>["hasForm"] = false;
  export let hasScrollingContent: ComponentProps<ModalBody>["hasScrollingContent"] = false;
  export let slotContent = "";
  export let alert = false;
  export let includeInput = false;
  export let headerLabel = "";
</script>

<ComposedModal bind:open {alert}>
  <ModalHeader title="Test Modal" label={headerLabel} />
  <ModalBody {hasForm} {hasScrollingContent} {...$$restProps}>
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
    {#if includeInput}
      <input data-testid="test-focus" />
    {/if}
  </ModalBody>
</ComposedModal>
