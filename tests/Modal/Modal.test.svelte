<script lang="ts">
  import Modal from "carbon-components-svelte/Modal/Modal.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let modalHeading = "";
  export let modalLabel: ComponentProps<Modal>["modalLabel"] = undefined;
  export let modalAriaLabel: ComponentProps<Modal>["modalAriaLabel"] =
    undefined;
  export let iconDescription = "Close the modal";
  export let hasForm = false;
  export let hasScrollingContent = false;
  export let primaryButtonText = "";
  export let primaryButtonDisabled = false;
  export let primaryButtonLoading = false;
  export let primaryButtonLoadingDescription = "Loading";
  export let primaryButtonIcon = undefined;
  export let shouldSubmitOnEnter = true;
  export let secondaryButtonText = "";
  export let secondaryButtons: ComponentProps<Modal>["secondaryButtons"] =
    undefined;
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";
  export let preventCloseOnClickOutside: ComponentProps<Modal>["preventCloseOnClickOutside"] =
    undefined;
  export let hideCloseButton = false;
  export let size: ComponentProps<Modal>["size"] = undefined;
  export let danger = false;
  export let alert = false;
  export let passiveModal = false;
  export let onopen: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
  export let onsubmit: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclickbuttonprimary: ((event: CustomEvent) => void) | undefined =
    undefined;
  export let onclickbuttonsecondary:
    | ((event: CustomEvent) => void)
    | undefined = undefined;
  export let closeOnSecondary = false;
  export let includeInput = true;
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
  {primaryButtonLoading}
  {primaryButtonLoadingDescription}
  {primaryButtonIcon}
  {shouldSubmitOnEnter}
  {secondaryButtonText}
  {secondaryButtons}
  {selectorPrimaryFocus}
  {preventCloseOnClickOutside}
  {hideCloseButton}
  {size}
  {danger}
  {alert}
  {passiveModal}
  on:open={(e) => onopen?.(e)}
  on:close={(e) => onclose?.(e)}
  on:submit={onsubmit || (() => console.log("submit"))}
  on:click:button--primary={onclickbuttonprimary || (() => console.log("click:button--primary"))}
  on:click:button--secondary={(e) => {
    if (closeOnSecondary) open = false;
    if (onclickbuttonsecondary) {
      onclickbuttonsecondary(e);
    } else {
      console.log("click:button--secondary", e.detail);
    }
  }}
  on:transitionend={(e) => console.log("transitionend", e.detail)}
>
  <slot />
  {#if includeInput}
    <input id="test-focus" data-testid="test-focus">
  {/if}
</Modal>
