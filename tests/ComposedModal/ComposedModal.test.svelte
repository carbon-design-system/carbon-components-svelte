<script lang="ts">
  import {
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open: ComponentProps<ComposedModal>["open"] = false;
  export let size: ComponentProps<ComposedModal>["size"] = undefined;
  export let danger: ComponentProps<ComposedModal>["danger"] = false;
  export let preventCloseOnClickOutside: ComponentProps<ComposedModal>["preventCloseOnClickOutside"] = false;
  export let containerClass: ComponentProps<ComposedModal>["containerClass"] =
    "";
  export let selectorPrimaryFocus: ComponentProps<ComposedModal>["selectorPrimaryFocus"] =
    "[data-modal-primary-focus]";

  export let headerTitle = "";
  export let headerLabel = "";
  export let bodyHasForm = false;
  export let bodyHasScrollingContent = false;
  export let footerPrimaryButtonText = "";
  export let footerPrimaryButtonDisabled = false;
  export let footerSecondaryButtonText = "";
  export let footerDanger = false;
  export let onopen: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
</script>

<ComposedModal
  bind:open
  {size}
  {danger}
  {preventCloseOnClickOutside}
  {containerClass}
  {selectorPrimaryFocus}
  on:open={onopen}
  on:close={onclose}
  on:submit={() => console.log("submit")}
  on:click:button--primary={() => console.log("click:button--primary")}
  on:transitionend={(e) => console.log("transitionend", e.detail)}
  {...$$restProps}
>
  {#if headerTitle || headerLabel}
    <ModalHeader title={headerTitle} label={headerLabel} />
  {/if}
  <ModalBody
    hasForm={bodyHasForm}
    hasScrollingContent={bodyHasScrollingContent}
  >
    <slot />
    <input id="test-focus" data-testid="test-focus" />
  </ModalBody>
  {#if footerPrimaryButtonText || footerSecondaryButtonText}
    <ModalFooter
      primaryButtonText={footerPrimaryButtonText}
      primaryButtonDisabled={footerPrimaryButtonDisabled}
      secondaryButtonText={footerSecondaryButtonText}
      danger={footerDanger}
      on:click:button--secondary={(e) =>
        console.log("click:button--secondary", e.detail)}
    />
  {/if}
</ComposedModal>
