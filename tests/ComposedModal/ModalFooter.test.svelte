<script lang="ts">
  import {
    ComposedModal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open = true;
  export let primaryButtonText: ComponentProps<ModalFooter>["primaryButtonText"] =
    "";
  export let primaryButtonIcon: ComponentProps<ModalFooter>["primaryButtonIcon"] =
    undefined;
  export let primaryButtonDisabled: ComponentProps<ModalFooter>["primaryButtonDisabled"] = false;
  export let primaryClass: ComponentProps<ModalFooter>["primaryClass"] =
    undefined;
  export let secondaryButtonText: ComponentProps<ModalFooter>["secondaryButtonText"] =
    "";
  export let secondaryButtons: ComponentProps<ModalFooter>["secondaryButtons"] =
    [];
  export let secondaryClass: ComponentProps<ModalFooter>["secondaryClass"] =
    undefined;
  export let danger: ComponentProps<ModalFooter>["danger"] = false;
  export let slotContent = "";
</script>

<ComposedModal
  bind:open
  on:submit={() => console.log("submit")}
  on:click:button--primary={() => console.log("click:button--primary")}
  on:close={() => console.log("close")}
>
  <ModalHeader title="Test Modal" />
  <ModalBody>Content</ModalBody>
  <ModalFooter
    {primaryButtonText}
    {primaryButtonIcon}
    {primaryButtonDisabled}
    {primaryClass}
    {secondaryButtonText}
    {secondaryButtons}
    {secondaryClass}
    {danger}
    on:click:button--secondary={(e) =>
      console.log("click:button--secondary", e.detail)}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
  </ModalFooter>
</ComposedModal>
