<script>
  /**
   * Set the size of the skeleton to match the field it stands in for.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let size = undefined;

  import { getContext } from "svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;
</script>

<div
  class:bx--skeleton={true}
  class:bx--multi-select={true}
  class:bx--list-box={true}
  class:bx--form-item={true}
  class:bx--list-box--xs={effectiveSize === "xs"}
  class:bx--list-box--sm={effectiveSize === "sm"}
  class:bx--list-box--lg={effectiveSize === "lg"}
  class:bx--list-box--xl={effectiveSize === "xl"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div role="button" class:bx--list-box__field={true}>
    <span class:bx--list-box__label={true}></span>
  </div>
</div>
