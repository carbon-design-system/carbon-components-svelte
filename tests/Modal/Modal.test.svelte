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
  on:open
  on:close
  on:submit={() => console.log("submit")}
  on:click:button--primary={() => console.log("click:button--primary")}
  on:click:button--secondary={(e) =>
    console.log("click:button--secondary", e.detail)}
  on:transitionend={(e) => console.log("transitionend", e.detail)}
>
  <slot />
  <input id="test-focus" data-testid="test-focus" />
</Modal>
