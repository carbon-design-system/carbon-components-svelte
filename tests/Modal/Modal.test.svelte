<script lang="ts">
  import { Modal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let modalHeading = "";
  export let modalLabel: string | undefined = undefined;
  export let modalAriaLabel: string | undefined = undefined;
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
  export let onopen: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclose: ((event: CustomEvent) => void) | undefined = undefined;
  export let onsubmit: ((event: CustomEvent) => void) | undefined = undefined;
  export let onclickbuttonprimary: ((event: CustomEvent) => void) | undefined =
    undefined;
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
  on:open={onopen}
  on:close={onclose}
  on:submit={onsubmit || (() => console.log("submit"))}
  on:click:button--primary={onclickbuttonprimary || (() => console.log("click:button--primary"))}
  on:click:button--secondary={(e) =>
    console.log("click:button--secondary", e.detail)}
  on:transitionend={(e) => console.log("transitionend", e.detail)}
>
  <slot />
  {#if includeInput}
    <input id="test-focus" data-testid="test-focus" />
  {/if}
</Modal>
