<script lang="ts">
  import { Modal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let modalHeading = "";
  export let modalLabel = "";
  export let modalAriaLabel = "";
  export let iconDescription = "Close the modal";
  export let hasForm = false;
  export let hasScrollingContent = false;
  export let primaryButtonText = "";
  export let primaryButtonDisabled = false;
  export let primaryButtonIcon = undefined;
  export let shouldSubmitOnEnter = true;
  export let secondaryButtonText = "";
  export let secondaryButtons: ComponentProps<Modal>["secondaryButtons"] =
    undefined;
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";
  export let preventCloseOnClickOutside = false;
  export let size: ComponentProps<Modal>["size"] = undefined;
  export let danger = false;
  export let alert = false;
  export let passiveModal = false;
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

<Modal
  bind:open
  {modalHeading}
  {modalLabel}
  {modalAriaLabel}
  {iconDescription}
  {hasForm}
  {hasScrollingContent}
  {primaryButtonText}
  {primaryButtonDisabled}
  {primaryButtonIcon}
  {shouldSubmitOnEnter}
  {secondaryButtonText}
  {secondaryButtons}
  {selectorPrimaryFocus}
  {preventCloseOnClickOutside}
  {size}
  {danger}
  {alert}
  {passiveModal}
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
  onclick_button__secondary={(e) => {
    console.log("click:button--secondary", e.detail);
    if (onclick_button__secondary) onclick_button__secondary(e);
  }}
  ontransitionend={(e) => {
    console.log("transitionend", e.detail);
    if (ontransitionend) ontransitionend(e);
  }}
>
  <slot />
  <input id="test-focus" data-testid="test-focus" />
</Modal>
