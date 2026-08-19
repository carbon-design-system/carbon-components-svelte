<script>
  import { uniqueId } from "../utils/uniqueId.js";

  /**
   * Specify the toggle size.
   * @type {"default" | "sm"}
   */
  export let size = "default";

  /** Specify the label text */
  export let labelText = "";

  /** Set an id for the input element */
  export let id = uniqueId();
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  {...$$restProps}
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <input
    type="checkbox"
    {id}
    class:bx--toggle={true}
    class:bx--toggle--small={size === "sm"}
    class:bx--skeleton={true}
  >
  <label
    aria-label={labelText
      ? undefined
      : $$props["aria-label"] ?? "Toggle is loading"}
    for={id}
    class:bx--toggle__label={true}
    class:bx--skeleton={true}
  >
    {#if labelText || $$slots.labelChildren}
      <span class:bx--toggle__label-text={true}>
        <slot name="labelChildren"> {labelText} </slot>
      </span>
    {/if}
    <span class:bx--toggle__text--left={true}></span>
    <span class:bx--toggle__appearance={true}></span>
    <span class:bx--toggle__text--right={true}></span>
  </label>
</div>
