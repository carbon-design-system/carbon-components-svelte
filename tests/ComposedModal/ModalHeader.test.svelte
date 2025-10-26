<script lang="ts">
  import {
    ComposedModal,
    ModalBody,
    ModalHeader,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open = true;
  export let title: ComponentProps<ModalHeader>["title"] = "";
  export let label: ComponentProps<ModalHeader>["label"] = "";
  export let labelClass: ComponentProps<ModalHeader>["labelClass"] = "";
  export let titleClass: ComponentProps<ModalHeader>["titleClass"] = "";
  export let closeClass: ComponentProps<ModalHeader>["closeClass"] = "";
  export let closeIconClass: ComponentProps<ModalHeader>["closeIconClass"] = "";
  export let iconDescription: ComponentProps<ModalHeader>["iconDescription"] =
    "Close";
  export let slotContent = "";
</script>

<ComposedModal bind:open on:close={() => console.log("close")}>
  <ModalHeader
    {title}
    {label}
    {labelClass}
    {titleClass}
    {closeClass}
    {closeIconClass}
    {iconDescription}
    on:click={() => console.log("click")}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
  </ModalHeader>
  <ModalBody>Content</ModalBody>
</ComposedModal>
