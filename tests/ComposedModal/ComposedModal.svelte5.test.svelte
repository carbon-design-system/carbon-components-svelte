<script lang="ts">
  import {
    ComposedModal,
    ModalHeader,
    ModalBody,
    ModalFooter,
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
  export let onopen: ((e: CustomEvent) => void) | undefined = undefined;
  export let onclose: ((e: CustomEvent) => void) | undefined = undefined;
  export let onsubmit: ((e: CustomEvent) => void) | undefined = undefined;
  export let onclick_button__primary: ((e: CustomEvent) => void) | undefined =
    undefined;
  export let onclick_button__secondary: ((e: CustomEvent) => void) | undefined =
    undefined;
  export let ontransitionend: ((e: CustomEvent) => void) | undefined =
    undefined;
</script>

<ComposedModal
  bind:open
  {size}
  {danger}
  {preventCloseOnClickOutside}
  {containerClass}
  {selectorPrimaryFocus}
  {onopen}
  {onclose}
  onsubmit={(e) => {
    console.log("submit");
    if (onsubmit) onsubmit(e);
  }}
  onclick_button__primary={(e) => {
    console.log("click:button--primary");
    if (onclick_button__primary) onclick_button__primary(e);
  }}
  ontransitionend={(e) => {
    console.log("transitionend", e.detail);
    if (ontransitionend) ontransitionend(e);
  }}
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
      onclick_button__secondary={(e) => {
        console.log("click:button--secondary", e.detail);
        if (onclick_button__secondary) onclick_button__secondary(e);
      }}
    />
  {/if}
</ComposedModal>
