<script>
  /** Set to `true` to hide the label title skeleton line */
  export let hideLabelTitle = false;

  /** Set to `true` to hide the label description skeleton line */
  export let hideLabelDescription = false;

  /**
   * Specify the size of the button skeleton, as on the FileUploader it
   * stands in for. Inherits the height of the parent `Form` size when
   * unset, otherwise defaults to `"small"`.
   * @type {import("../Button/Button.svelte").ButtonProps["size"]}
   */
  export let size = undefined;

  import { getContext } from "svelte";
  import ButtonSkeleton from "../Button/ButtonSkeleton.svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import { formButtonSize } from "../utils/form-button-size.js";

  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? formButtonSize($formSize) ?? "small";
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabelTitle}
    <p class:bx--file--label={true} class:bx--skeleton={true}></p>
  {/if}
  {#if !hideLabelDescription}
    <p class:bx--label-description={true} class:bx--skeleton={true}></p>
  {/if}
  <ButtonSkeleton size={effectiveSize} />
  <!-- The uploader's file list, empty: its top margin is part of its height. -->
  <div class:bx--file-container={true}></div>
</div>
