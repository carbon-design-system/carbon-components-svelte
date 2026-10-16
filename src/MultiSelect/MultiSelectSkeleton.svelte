<script>
  /**
   * Set the size of the skeleton to match the field it stands in for.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to hide the label text */
  export let hideLabel = false;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;
</script>

<div
  class:bx--form-item={!inline}
  class:bx--multi-select__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--multi-select__wrapper--inline={inline}
  class:bx--list-box__wrapper--inline={inline}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if !hideLabel}
    <span class:bx--label={true} class:bx--skeleton={true}></span>
  {/if}
  <div
    class:bx--skeleton={true}
    class:bx--multi-select={true}
    class:bx--list-box={true}
    class:bx--list-box--inline={inline}
    class:bx--multi-select--inline={inline}
    class:bx--list-box--xs={effectiveSize === "xs"}
    class:bx--list-box--sm={effectiveSize === "sm"}
    class:bx--list-box--lg={effectiveSize === "lg"}
    class:bx--list-box--xl={effectiveSize === "xl"}
  >
    <div role="button" class:bx--list-box__field={true}>
      <span class:bx--list-box__label={true}></span>
    </div>
  </div>
</div>
